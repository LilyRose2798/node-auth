// to run script enter the following command in the mongo shell:
// mongo > load("create-mongodb-indexes.js")

db.users.createIndex({ username: 1 })
db.users.createIndex({ email: 1 })
