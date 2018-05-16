const turbo       = require('turbo360')({site_id: process.env.TURBO_APP_ID})
const constants   = require('../constants')
const collections = require('../collections') 
const functions   = require('../functions')

const Home = (req, res) => {
    res.render('home')
}


module.exports = {
    Home: Home
}