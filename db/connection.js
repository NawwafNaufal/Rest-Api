const con = require('mysql')

const db = con.createConnection ({
    host : "localhost",
    user : "root",
    password : "",
    database : "clan"
})

db.connect((err,result) => {
    if(err) throw err
    console.log("Connect")
})

module.exports = {db}
