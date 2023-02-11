// Setting up telegram bot
const TelegramApi = require("node-telegram-bot-api")
const token = "" // token
const bot = new TelegramApi(token, { polling: true })


// Getting data from files to operate with
const fs = "fs"
var mode = "./mode"
var devId = "./devId"
var chats = "./chats"
var stats = "./stats"

// Setting up commands
bot.setMyCommands([
    { command: "/nauweek", description: "Який наразі навчальний тиждень?" },
    { command: "/readme", description: "Додатковий функціонал" },
    { command: "/calendar", description: "Календар 2 cеместру"}
])

// Creating these variables to make it easier to operate with commands
var commands = {
    nauweek: "/nauweek",
    readme: "/readme",
    calendar: "/calendar",

    stats: "/stats",
    chats: "/chats",
    invert: "/invert",

    start: "/start",
}
var allCommands = ["/nauweek", "/nauweek@nauweek_bot", "/readme", "/readme@nauweek_bot", "/start", "/start@nauweek_bot",
"/calendar", "/calendar@nauweek_bot"]
var devCommands = ["/stats", "/stats@nauweek_bot", "/chats", "/chats@nauweek", "/invert", "/invert@nauweek_bot"]

// Main
bot.on("message", msg => {

    // Creating these variables to make it easier to operate with message
    let text = msg.text.toLowerCase()
    let chatId = msg.chat.id
    let msgId = msg.message_id
    let userId = msg.from.id
    let user = msg.from

    // Developer commands
    if (devCommands.includes(text) && userId === devId) {
        if (text.includes(commands.stats)) {
            sendMessage(chatId, getStats())
            deleteMessages(chatId, msgId, true, 10)
            return
        } 
        else if (text.includes(commands.chats)) {
            sendMessage(chatId, getChats()) 
            deleteMessages(chatId, msgId, true, 10)
            return
        } else if (text.includes(commands.invert)) {
            sendMessage(chatId, invert())
            saveMode()
            deleteMessages(chatId, msgId, true, 10)
            return
        }
        // Deleting messages
        deleteMessages(chatId, msgId, true, 10)
        return
    }

    // If a message is not a command request, then ignore it and do not execute the following code
    // The same is if message was sent by bot
    if (!allCommands.includes(text) || user.is_bot) {
        return
    }

    // Main bot commands
    if (text.includes(commands.nauweek)) {
        bot.sendMessage(chatId, nauweek(), { parse_mode: "HTML" }).then((m) => {
            setTimeout(function () {
                bot.deleteMessage(chatId, m.message_id)
            }, 60 * 1000)
        })
        deleteMessage(chatId, msgId)
        // Increasinng stats counter and adding a chat to chats list
        stats++
        if (!chats.includes(chatId)) {
            chats.push(chatId)
            // Saving chats array
            saveChats()
        }
        // Saving stats counter
        saveStats()
    } else if (text.includes(commands.readme)) {
        // sendMessage(chatId, readme())
        bot.sendMessage(chatId, readme(), { parse_mode: "HTML" }).then((m) => {
            setTimeout(function () {
                bot.deleteMessage(chatId, m.message_id)
            }, 60 * 1000)
        })

    } 
    else if (text.includes(commands.calendar)) {
        
        bot.sendPhoto(chatId, "").then((m) => { // link photo
            setTimeout(function () {
                bot.deleteMessage(chatId, m.message_id)
            }, 60 * 1000)
        })
        
        // deleteMessages(chatId, msgId, false)
        // return
    } 
    else if (text.includes(commands.start)) {
        bot.sendMessage(chatId, start())

        // A user calls this command 90% times at private messages with the bot, when getting acquinted with it. Clearing up all messages means autodelete the chat from chatlist of the user. So it is mandatory not to delete the bot answer
        
        deleteMessages(chatId, msgId, false)
        return
    }

    // Deleting message
    deleteMessage(chatId, msgId)
    return
})



// Function to get message of what studying week it is now
function nauweek() {
    // Getting date and week
    let date = new Date()
    let week = whatWeek(date.getWeek())

    // getDay() function sets Sunday as the first day of the week, so
    // if it is Sun-0, Sat-6 or Fri-5, add to the message that the week is ending up
    // Otherwise just send what week it is now
    if ([5].includes(date.getDay())) {
        return `🚩 Закінчується ${week}-й тиждень\n\n` +
        "• • • • • • • • • • • • • • • • • • •\n" +
        "⏰ Початок та кінець пар:\n" +
        "• 1 пара - 8.00 - 9.35\n" +
        "• 2 пара - 9.50 - 11.25\n" +
        "• 3 пара - 11.40 - 13.15\n" +
        "• 4 пара - 13.30 - 15.05\n" +
        "• 5 пара - 15.20 - 16.55\n" +
        "• 6 пара - 17.10 - 18.45" 
    } 
    else if ([0, 6].includes(date.getDay())) {
        if (week == 2) {
            return `🚩 Закінчується ${week}-й тиждень\n\n`+
            `З понеділка ${week - 1}-й тиждень`
        }
        else {
            return `🚩 Закінчується ${week}-й тиждень\n\n`+
            `З понеділка ${week + 1}-й тиждень`
        }
    }
    else {
        return `🚩 Наразі ${week}-й тиждень\n\n` +
        "• • • • • • • • • • • • • • • • • • •\n" +
        "⏰ Початок та кінець пар:\n" +
        "• 1 пара - 8.00 - 9.35\n" +
        "• 2 пара - 9.50 - 11.25\n" +
        "• 3 пара - 11.40 - 13.15\n" +
        "• 4 пара - 13.30 - 15.05\n" +
        "• 5 пара - 15.20 - 16.55\n" +
        "• 6 пара - 17.10 - 18.45" 
    }
}

// Function to calculate number of studying week
function whatWeek(weekNum) {

    if (weekNum % 2 === 1) {
        return mode ? 1 : 2
    } else {
        return mode ? 2 : 1
    }
    
}

// Function to get readme message
function readme() {
    return "Бот запобігає флуду, видаляючи надіслані команди (command requests). Задля цього, надайте @nauweek_bot статус адміністратора групи із можливістю видалення повідомлень"
}

// Function to get start message
function start() {
    return '👋 Вітаю! Щоб дізнатись який тиждень навчання, відправ команду /nauweek.\n' +
    '\n👀 Щоб дізнатись коли сесія і канікули - команду /calendar\n' +
    '\n🧑‍🦯 Додай цей бот в чат своєї групи, щоб там не питали "який тиждень?"'
}


// Developer command / Function to get stats info
function getStats() {
    return `stats: ${stats}`
}

// Developer command / Function to get chats counter
function getChats() {
    return `chats: ${chats.length}`
}

// Function to get the calendar
function getCalendar() {
    return "" // link photo
}

// Developer command / To invert week numbers
function invert() {

    // Inverting week number
    if (mode) {
        mode = false
    } else {
        mode = true
    }

    return `Нумерація тижнів змінена`
}

// Simplified way to send a message
function sendMessage(chatId, text) {
    bot.sendMessage(chatId, text, { parse_mode: "HTML" })
}

// Function to clear up user command request message and bot's reply
function deleteMessage(chatId, msgId) {

    setTimeout(function () {
        bot.deleteMessage(chatId, msgId)
    }, 60 * 1000)

}

// Functions to save data
function saveStats() {
    fs.writeFile("stats.json", JSON.stringify(stats), err => {
        if (err) throw err; // Checking for errors
    })
}
function saveChats() {
    fs.writeFile("chats.json", JSON.stringify(chats), err => {
        if (err) throw err; // Checking for errors
    })
}
function saveMode() {
    fs.writeFile("mode.json", JSON.stringify(mode), err => {
        if (err) throw err; // Checking for errors
    })
}

// Special added function to find out which week number it is now
// This function doesn't exist in basic list of Date object methods
// Imported from the internet
Date.prototype.getWeek = function () {

    var date = new Date(this.getTime())
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7)
    var week1 = new Date(date.getFullYear(), 0, 4)
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7)
}
