
const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt")
const {open} = require("sqlite");
const sqlite3 = require("sqlite3")
const jwt = require("jsonwebtoken")
const app = express()

app.use(express.json())

const dbpath = path.join(__dirname, "user413.db");

let db = null;

const initialization = async () => {
    try{
        db = await open({
            filename:dbpath,
            driver: sqlite3.Database
        })
        app.listen(3000, ()=> {
            console.log("server running on 3000 port")
        })

    }catch(e){
        console.log(`error occurs in db: ${e.message}`)
        process.exit(1)

    }

}
initialization()

//userRegister

app.post("/userdetails/", async (request,response) => {
    const {username, name, password, gender, location} = request.body;
    const hashedPassword = await bcrypt.hash(password,10);
    const userQuery = `
    SELECT * FROM userdetails WHERE username = '${username}';
    `;
    const dbUser = await db.get(userQuery);
    if (dbUser === undefined){
        //create user in userdetails
        const createQuery = `
        INSERT INTO userdetails (username,name,password,gender,location) VALUES ('${username}','${name}','${hashedPassword}','${gender}','${location}');
        `;
        await db.run(createQuery)
        response.send("user created successfull")
    }else{

  // handle user error
    response.status(400)
    response.send("user already created")
    }
})

//login user 
app.post("/login/", async (request,response) => {
    const {username,password} = request.body;
    const userQuery = `
    SELECT * FROM userdetails WHERE username = '${username}';
    `;
    const dbUser = await db.get(userQuery);
    if (dbUser === undefined){
        // user doesnt exit
        response.status(400)
        response.send("Invalid user login")
       
    }else{
  // campare password
  const isPasswordMatched = await bcrypt.compare(password,dbUser.password)
  if (isPasswordMatched === true){
    const playload = {username: username};
    const jwtToken = jwt.sign(playload,"book@413");
    //response.status(400)
    response.send(jwtToken)

  }else{
    response.send(400)
    response.send("Invalid password")

  }
    
    }
})

// authentication user 

const actunticationjwtToken = (request,response,next) => {
    let jwtToken;
    const authHeader = request.headers["authorization"]
    if (authHeader !== undefined){
        jwtToken = authHeader.split(" ")[1]
    }
    if (jwtToken === undefined){
        response.send(401)
        response.send("user unauthorized")
    }else{
        jwt.verify(jwtToken,"book@413", async (error, playload) => {
            if (error){
                response.send(401)
                response.send("Invalid access token")

            }else{
                request.username = playload.username
                next();
                

            }
        })
    }


}



// post user
app.post("/user413/", async (request,response) => {
    const {id,name,email} = request.body 
    const adduser = `
    INSERT INTO user413(id,name,email) VALUES (${id},'${name}','${email}');`;
    const userresponse = await db.run(adduser)
    const updateId = userresponse.lastId
    response.send("success add")
})

//get detalis
app.get("/user413/",actunticationjwtToken, async (request,response) => {
    const getuser = `
                SELECT * FROM user413;
                `;
                const userresponse = await db.all(getuser)
                response.send(userresponse)
    
   
})


// profile 
app.get("/profile/",actunticationjwtToken, async (request,response) => {
    const {username} = request;
    console.log(username)
    const getuser = `
                SELECT * FROM userdetails WHERE username = '${username}';
                `;
                const userresponse = await db.get(getuser)
                response.send(userresponse)
    
   
})


// detele 
app.delete("/user413/:id/", async (request,response) => {
    const {id} = request.params
    const deleteuser = `
    DELETE FROM user413 WHERE id = ${id};
    `;
    const userresponse = await db.run(deleteuser)
    response.send("sucess deteled")

})

//update
app.put("/user413/:id/", async (request,response) => {
    const {name} = request.body;
    const {id} = request.params;
    const adduser = `
    UPDATE user413 SET name = '${name}' WHERE id = ${id};`;
    const userresponse = await db.run(adduser)
    const updateId = userresponse.lastId
    response.send("success updated")
})

module.exports = app