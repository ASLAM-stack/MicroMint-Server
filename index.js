const express = require('express');
const app = express()
const port = process.env.PORT || 5000;
const cors = require('cors');


//middleware 
app.use(cors())
app.use(express.json())


//test working server
app.listen(port,() => {
    console.log(`MicroMint is running port on ${port}`);
})
app.get('/',(req,res) =>{
    res.send("MicroMint is working")
})
