const SubscriptionPlan = require("../models/SubscriptionPlan");

// Get all subscription plans (for superadmin management)
const getAllPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.findAll({
      order: [['display_order', 'ASC'], ['id', 'ASC']]
    });
    
    // Parse plan_features JSON string to array
    const parsedPlans = plans.map(plan => ({
      ...plan.toJSON(),
      plan_features: plan.plan_features ? JSON.parse(plan.plan_features) : []
    }));
    
    return res.status(200).json({
      success: true,
      plans: parsedPlans
    });
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch subscription plans",
      error: error.message
    });
  }
};

// Get only active plans (for public display on Register page)
const getActivePlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.findAll({
      where: { is_active: true },
      order: [['display_order', 'ASC'], ['id', 'ASC']]
    });
    
    // Parse plan_features JSON string to array
    const parsedPlans = plans.map(plan => ({
      ...plan.toJSON(),
      plan_features: plan.plan_features ? JSON.parse(plan.plan_features) : []
    }));
    
    return res.status(200).json({
      success: true,
      plans: parsedPlans
    });
  } catch (error) {
    console.error("Error fetching active subscription plans:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch subscription plans",
      error: error.message
    });
  }
};

// Create new subscription plan
const createPlan = async (req, res) => {
  try {
    const {
      plan_name,
      plan_price,
      plan_validity_days,
      plan_features,
      badge,
      show_gst,
      gst_percentage,
      is_active,
      display_order
    } = req.body;

    // Validate required fields
    if (!plan_name || !plan_price || !plan_validity_days) {
      return res.status(400).json({
        success: false,
        message: "Plan name, price, and validity days are required"
      });
    }

    // Convert plan_features array to JSON string
    const featuresJson = Array.isArray(plan_features) 
      ? JSON.stringify(plan_features) 
      : plan_features;

    const newPlan = await SubscriptionPlan.create({
      plan_name,
      plan_price: parseFloat(plan_price),
      plan_validity_days: parseInt(plan_validity_days),
      plan_features: featuresJson,
      badge: badge || null,
      show_gst: show_gst !== undefined ? show_gst : true,
      gst_percentage: gst_percentage || 18,
      is_active: is_active !== undefined ? is_active : true,
      display_order: display_order || 0,
      created_at: new Date()
    });

    return res.status(201).json({
      success: true,
      message: "Subscription plan created successfully",
      plan: {
        ...newPlan.toJSON(),
        plan_features: featuresJson ? JSON.parse(featuresJson) : []
      }
    });
  } catch (error) {
    console.error("Error creating subscription plan:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create subscription plan",
      error: error.message
    });
  }
};

// Update subscription plan
const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      plan_name,
      plan_price,
      plan_validity_days,
      plan_features,
      badge,
      show_gst,
      gst_percentage,
      is_active,
      display_order
    } = req.body;

    const plan = await SubscriptionPlan.findByPk(id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Subscription plan not found"
      });
    }

    // Convert plan_features array to JSON string if it's an array
    const featuresJson = Array.isArray(plan_features) 
      ? JSON.stringify(plan_features) 
      : plan_features;

    // Update fields
    if (plan_name !== undefined) plan.plan_name = plan_name;
    if (plan_price !== undefined) plan.plan_price = parseFloat(plan_price);
    if (plan_validity_days !== undefined) plan.plan_validity_days = parseInt(plan_validity_days);
    if (plan_features !== undefined) plan.plan_features = featuresJson;
    if (badge !== undefined) plan.badge = badge;
    if (show_gst !== undefined) plan.show_gst = show_gst;
    if (gst_percentage !== undefined) plan.gst_percentage = gst_percentage;
    if (is_active !== undefined) plan.is_active = is_active;
    if (display_order !== undefined) plan.display_order = display_order;
    plan.updated_at = new Date();

    await plan.save();

    return res.status(200).json({
      success: true,
      message: "Subscription plan updated successfully",
      plan: {
        ...plan.toJSON(),
        plan_features: plan.plan_features ? JSON.parse(plan.plan_features) : []
      }
    });
  } catch (error) {
    console.error("Error updating subscription plan:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update subscription plan",
      error: error.message
    });
  }
};

// Delete subscription plan
const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await SubscriptionPlan.findByPk(id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Subscription plan not found"
      });
    }

    await plan.destroy();

    return res.status(200).json({
      success: true,
      message: "Subscription plan deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting subscription plan:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete subscription plan",
      error: error.message
    });
  }
};

module.exports = {
  getAllPlans,
  getActivePlans,
  createPlan,
  updatePlan,
  deletePlan
};
