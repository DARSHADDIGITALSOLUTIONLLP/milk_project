const { Op } = require("sequelize");
const DailyFarmerOrder = require("../models/DailyFarmerOrder");
const Farmer = require("../models/Farmer");
const moment = require("moment-timezone");
const FarmerPayment = require("../models/FarmerPayment");


module.exports.getFarmerTodaysOrder = async (req, res) => {
    try {
        const { id } = req.user;

        const now = new Date();

        const startOfToday = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            0, 0, 0
        );

        const startOfTomorrow = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 1,
            0, 0, 0
        );

        // 🔸 Fetch today's milk entries using created_at date range
        const rawOrders = await DailyFarmerOrder.findAll({
            where: {
                farmer_id: id,
                created_at: {
                    [Op.gte]: startOfToday,
                    [Op.lt]: startOfTomorrow,
                },
            },
            order: [["created_at", "asc"]],
        });

        // 🔄 Format orders to include time
        const orders = rawOrders.map(order => {
            const orderData = order.toJSON();
            const time = new Date(order.created_at).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            });
            return { ...orderData, time };
        });

        // 🔸 Fetch farmer info
        const farmer = await Farmer.findOne({
            where: { id },
            attributes: { exclude: ["password_hash"] },
        });

        if (!farmer) {
            return res.status(404).json({ message: "Farmer not found" });
        }

        res.json({
            message: "Today's milk summary with latest fat and farmer details",
            farmer,
            orders,
        });

    } catch (error) {
        console.error("Error in fetching today's milk summary for farmer:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports.getFarmerPaymentHistory = async (req, res) => {
    try {
        const farmerId = req.user.id;

        if (!farmerId) {
            return res.status(401).json({ message: "Unauthorized access." });
        }

        const currentMonth = moment().tz("Asia/Kolkata");
        const lastMonth = moment().tz("Asia/Kolkata").subtract(1, "month");
        const monthsToProcess = [currentMonth, lastMonth];

        const farmer = await Farmer.findByPk(farmerId);
        if (!farmer) {
            return res.status(404).json({ message: "Farmer not found." });
        }

        let payments = [];


        const startDate = lastMonth.clone().startOf("month").toDate();
        const endDate = currentMonth.clone().endOf("month").toDate();

        const orders = await DailyFarmerOrder.findAll({
            where: {
                farmer_id: farmerId,
                created_at: {
                    [Op.between]: [startDate, endDate],
                },
            },
            raw: true,
        });

        const weekMap = {};

        for (const order of orders) {
            const orderDate = moment(order.created_at).tz("Asia/Kolkata");
            const week = orderDate.isoWeek();
            const year = orderDate.isoWeekYear();
            const weekKey = `${year}-W${week}`;

            if (!weekMap[weekKey]) {
                weekMap[weekKey] = {
                    week_number: week,
                    year: year,
                    start_date: orderDate.clone().startOf("isoWeek").format("YYYY-MM-DD"),
                    end_date: orderDate.clone().endOf("isoWeek").format("YYYY-MM-DD"),
                    total_cow_quantity: 0,
                    total_buffalo_quantity: 0,
                    total_pure_quantity: 0,
                    total_amount: 0,

                };
            }

            const cowQty = Number(order.cow_quantity) || 0;
            const cowRate = Number(order.cow_rate) || 0;
            const buffaloQty = Number(order.buffalo_quantity) || 0;
            const buffaloRate = Number(order.buffalo_rate) || 0;
            const pureQty = Number(order.pure_quantity) || 0;
            const pureRate = Number(order.pure_rate) || 0;

            const weekData = weekMap[weekKey];
            weekData.total_cow_quantity += cowQty;
            weekData.total_buffalo_quantity += buffaloQty;
            weekData.total_pure_quantity += pureQty;

            weekData.total_amount += (cowRate) + (buffaloRate) + (pureRate);
        }

        const weekPayments = Object.values(weekMap).sort((a, b) => {
            if (a.year === b.year) return a.week_number - b.week_number;
            return a.year - b.year;
        });

        for (const week of weekPayments) {
            const existing = await FarmerPayment.findOne({
                where: {
                    farmer_id: farmerId,
                    week_number: week.week_number,
                    week_start_date: week.start_date,
                    week_end_date: week.end_date,
                },
            });

            if (existing) {
                await existing.update({
                    total_cow_quantity: week.total_cow_quantity,
                    total_buffalo_quantity: week.total_buffalo_quantity,
                    total_pure_quantity: week.total_pure_quantity,
                    total_amount: week.total_amount,
                });
                week.status = existing.status;;
            } else {
                const newPayment = await FarmerPayment.create({
                    farmer_id: farmerId,
                    dairy_name: farmer.dairy_name,
                    week_number: week.week_number,
                    week_start_date: week.start_date,
                    week_end_date: week.end_date,
                    total_cow_quantity: week.total_cow_quantity,
                    total_buffalo_quantity: week.total_buffalo_quantity,
                    total_pure_quantity: week.total_pure_quantity,
                    total_amount: week.total_amount,
                    status: false,
                });
                week.status = newPayment.status;
            }
        }

        payments.push({

            dairy_name: farmer.dairy_name,
            week_wise_summary: weekPayments,

        });


        return res.status(200).json({
            message: "Farmer weekly payment summary fetched and stored successfully.",
            farmer: {
                id: farmer.id,
                full_name: farmer.full_name,
                contact: farmer.contact,
                email: farmer.email,
                dairy_name: farmer.dairy_name,
                advance_payment: farmer.advance_payment,
                advance_payment_date: farmer.advance_payment_date,
            },
            payments,
        });

    } catch (error) {
        console.error("Error fetching farmer payment summary:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

module.exports.getallMyDailyOrderHistory = async (req, res) => {
    const farmerId = req.user.id;
    // console.log(farmerId);

    if (!farmerId) {
        return res.status(401).json({ message: "Unauthorized access." });
    }

    const startDate = moment().subtract(1, 'month').startOf('day').toDate();
    const endDate = moment().endOf('day').toDate();

    try {
        // Step 1: Get all farmers under the dairy
        const farmer = await Farmer.findOne({
            where: { id: farmerId },
            attributes: ["id", "full_name", "contact", "email", "dairy_name", "advance_payment"],
            raw: true
        });
        if (!farmer) {
            return res.status(404).json({ message: "Farmer not found" });
        }
        // console.log(farmer);



        // Step 2: Fetch orders for these farmers in date range
        const orders = await DailyFarmerOrder.findAll({
            where: {
                farmer_id: farmer.id,
                created_at: {
                    [Op.between]: [startDate, endDate]
                }
            },
            raw: true
        });
        // console.log(orders);

        // Step 3: Attach farmer details to each order
        const formattedOrders = orders.map(order => {


            const time = new Date(order.created_at).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            });
            return {
                ...order,
                date: moment(order.created_at).format("YYYY-MM-DD"),
                time,
                farmer
            };
        });

        res.status(200).json({

            data: formattedOrders
        });

    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch orders"
        });
    }
};