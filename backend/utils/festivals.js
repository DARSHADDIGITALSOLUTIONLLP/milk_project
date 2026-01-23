/**
 * Indian Festivals List with Dates
 * Dates are in MM-DD format (month-day)
 * Note: Some festivals like Diwali, Holi, etc. have variable dates based on lunar calendar
 * For these, approximate dates are provided, but you may need to update them yearly
 */

const festivals = [
    // January
    { name: "New Year", date: "01-01", greeting: "🎉 Happy New Year! Wishing you a year filled with happiness, prosperity, and fresh milk every day!" },
    { name: "Makar Sankranti", date: "01-14", greeting: "🪁 Happy Makar Sankranti! May this festival bring you joy, prosperity, and sweet moments with your family!" },
    { name: "Test Festival", date: "01-23", greeting: "🧪 Test Festival Greetings! This is a demo festival for testing the notification system. Wishing you a wonderful day!" },
    { name: "Republic Day", date: "01-26", greeting: "🇮🇳 Happy Republic Day! Celebrating the spirit of unity and freedom. Jai Hind!" },
    
    // February
    { name: "Vasant Panchami", date: "02-14", greeting: "🌸 Happy Vasant Panchami! May Goddess Saraswati bless you with wisdom and knowledge!" },
    
    // March
    { name: "Holi", date: "03-25", greeting: "🎨 Happy Holi! May your life be filled with vibrant colors, joy, and sweet moments. Have a safe and colorful celebration!" },
    { name: "Ram Navami", date: "03-30", greeting: "🕉️ Happy Ram Navami! May Lord Rama's blessings bring peace and prosperity to your home!" },
    
    // April
    { name: "Good Friday", date: "04-18", greeting: "✝️ Wishing you peace and reflection on this Good Friday." },
    { name: "Easter", date: "04-20", greeting: "🐰 Happy Easter! May this day bring you joy, hope, and new beginnings!" },
    { name: "Ambedkar Jayanti", date: "04-14", greeting: "🙏 On Ambedkar Jayanti, let's remember the great leader who fought for equality and justice." },
    { name: "Ramzan Eid", date: "04-10", greeting: "🌙 Eid Mubarak! May this holy occasion bring you peace, happiness, and prosperity!" },
    
    // May
    { name: "Akshaya Tritiya", date: "05-10", greeting: "✨ Happy Akshaya Tritiya! May this auspicious day bring you endless prosperity and good fortune!" },
    { name: "Buddha Purnima", date: "05-23", greeting: "🪷 Happy Buddha Purnima! May peace and enlightenment be with you always!" },
    
    // June
    { name: "Eid al-Adha", date: "06-16", greeting: "🕌 Eid al-Adha Mubarak! May this blessed festival bring you and your family peace, happiness, and prosperity!" },
    
    // July
    { name: "Guru Purnima", date: "07-21", greeting: "🙏 Happy Guru Purnima! Let's express gratitude to our teachers and mentors who guide us in life!" },
    
    // August
    { name: "Raksha Bandhan", date: "08-19", greeting: "🪢 Happy Raksha Bandhan! Celebrating the beautiful bond between siblings. May your bond grow stronger!" },
    { name: "Independence Day", date: "08-15", greeting: "🇮🇳 Happy Independence Day! Let's celebrate the freedom and unity of our great nation. Jai Hind!" },
    { name: "Janmashtami", date: "08-26", greeting: "🕉️ Happy Janmashtami! May Lord Krishna's blessings fill your life with love, joy, and prosperity!" },
    { name: "Onam", date: "08-20", greeting: "🎊 Happy Onam! Wishing you a harvest festival filled with joy, prosperity, and delicious feasts!" },
    
    // September
    { name: "Ganesh Chaturthi", date: "09-07", greeting: "🐘 Happy Ganesh Chaturthi! May Lord Ganesha remove all obstacles and bring you success and happiness!" },
    
    // October
    { name: "Gandhi Jayanti", date: "10-02", greeting: "🙏 On Gandhi Jayanti, let's remember the Father of the Nation and his teachings of truth and non-violence." },
    { name: "Dussehra", date: "10-12", greeting: "⚔️ Happy Dussehra! May the victory of good over evil inspire you to overcome all challenges in life!" },
    { name: "Karva Chauth", date: "10-20", greeting: "💑 Happy Karva Chauth! Wishing all couples a lifetime of love, togetherness, and happiness!" },
    
    // November
    { name: "Diwali", date: "11-01", greeting: "🪔 Happy Diwali! May the festival of lights illuminate your life with happiness, prosperity, and success. Wishing you a bright and joyful celebration!" },
    { name: "Bhai Dooj", date: "11-03", greeting: "💝 Happy Bhai Dooj! Celebrating the special bond between brothers and sisters. May your relationship grow stronger!" },
    { name: "Chhath Puja", date: "11-07", greeting: "🌅 Happy Chhath Puja! May this sacred festival bring you health, prosperity, and divine blessings!" },
    { name: "Guru Nanak Jayanti", date: "11-15", greeting: "🕉️ Happy Guru Nanak Jayanti! May Guru Nanak's teachings guide you towards peace and enlightenment!" },
    
    // December
    { name: "Christmas", date: "12-25", greeting: "🎄 Merry Christmas! May this festive season bring you joy, peace, and happiness. Wishing you a wonderful celebration with your loved ones!" },
    { name: "New Year's Eve", date: "12-31", greeting: "🎊 Happy New Year's Eve! As we bid farewell to this year, may the coming year bring you endless joy and success!" },
];

/**
 * Get festival for a specific date
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {Object|null} - Festival object or null if no festival on that date
 */
function getFestivalForDate(dateString) {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateKey = `${month}-${day}`;
    
    return festivals.find(festival => festival.date === dateKey) || null;
}

/**
 * Get all festivals
 * @returns {Array} - Array of all festivals
 */
function getAllFestivals() {
    return festivals;
}

module.exports = {
    getFestivalForDate,
    getAllFestivals,
    festivals
};
