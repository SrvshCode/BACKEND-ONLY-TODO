const express = require('express')
const fs = require("fs");
const path= require("path");
const app = express()
const port = 3000

app.use(express.json());
const filePath =path.join(__dirname,"Data", "todos.json");


//without using util.promisify or fs.promises

const readFileAsync= ()=>{
    return new Promise((resolve, reject)=>{
        fs.readFile(filePath,"utf-8",(err,data)=>{
            if(err){
                if(err.code ==="ENOENT")
                    return resolve('[]'); //file does not exists return empty array.
            return reject(err);
            }
            resolve(data);
        });
    });

};

const writeFileAsync = (data)=>{
    return new Promise((resolve, reject)=>{
        fs.writeFile(filePath,data,"utf-8",(err)=>{
            if(err)
                return reject(err);
        resolve();
        });
    });
}
//readfile service
const readfileService =async()=>{

    const data= await readFileAsync();
    return data ? JSON.parse(data):[];

};

//write file service
const writeFileService =async (todo)=>{

    await writeFileAsync(JSON.stringify(todo,null,2),);

}


//getting all to-dos if null display specific message
app.get('/todos', async(req, res,next) => {
    
       try{
        const todos= await readfileService();
        if(!todos.length)
            throw new Error("NO Todos Available");
        res.json(todos);
       }catch(err){
        next(err);
       }      
 
})


//creating a todo

app.post("/todos",async(req,res,next)=>{

    const {title,userName, isCompleted}= req.body;
    if(!title|| !userName)
        return res.status(400).json({message:"Invalid Data"})

    try{
        const todos= await readfileService();
        const createTodo={
            id:todos.length? todos[todos.length-1].id+1:1,
            userName,
            title,
            isCompleted:isCompleted || false
        }; 
            todos.push(createTodo);
            await writeFileService(todos);
            res.status(201).json(createTodo);
    }catch(err){
        next(err);
    }
})

//deleting a todo by ID

app.delete("/todos/:id",async(req,res,next)=>{
    try{
        const id= parseInt(req.params.id);
        const  todos=await readfileService()
        const newTodos = todos.filter(todo=> todo.id !== id);
        if(newTodos.length === todos.length)
            return res.status(404).send(`Todo with ID:${id} not Found!`);
        await writeFileService(newTodos);
        res.status(204).end();
    }catch(e){
        next(e);
    }
})

//updating a todo

app.put("/todos/:id",async(req,res,next)=>{
    try{
        const{title,isCompleted}=req.body;
        const todos= await readfileService();
        const updateTodo = todos.find(t=>t.id === parseInt(req.params.id));
    
        if(!updateTodo)
            return res.status(404).send({message:`todo with id: ${req.params.id} not found!`});
    
                updateTodo.title= title !==undefined? title:updateTodo.title;
                updateTodo.isCompleted=isCompleted !== undefined?isCompleted:updateTodo.isCompleted;
                await writeFileService(todos);
                res.json(updateTodo);
    }catch(e){
       next(e);
    }
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })


//error handling middleware

const ErrorHandlerService =(err, req,res,next)=>{
    console.log(err);
    res.status(500).send({message:"Some error occurred",details:err.message});
}
app.use(ErrorHandlerService);
// curl -X PUT http://localhost:3000/todos/3 -H "Content-Type: application/json" -d '{"isCompleted": false}'
// curl -X POST http://localhost:3000/todos -H "Content-Type: application/json" -d '{"title": "Learn Terminal", "userName": "SACHIN"}'
// curl -X DELETE http://localhost:3000/todos/1
//curl -X GET http://localhost:3000/todos
