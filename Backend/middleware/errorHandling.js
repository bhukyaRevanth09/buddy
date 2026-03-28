

const errorHandler = (err,req,res,next)=>{

    let statusCode = err.statusCode || 500;
    let message = err.message || "Interal server error";
     console.log(err)


    if(err.code === 11000){
        statusCode = 409;
        message = "user already exsits";
    }

    else if(err.name === "validationError"){
        statusCode = 422;
        message = err?.message;
    }

    else if(err.name === "CastError"){
        statusCode = 400;
        message = "Invalid ID fromat" 
    }
    else if (err.statusCode === 404){
        statusCode = 404;
        message = err.message || "data not founded"
    }
    
    


    res.status(statusCode).json({
        success : false,
        message
    })
}

export default errorHandler

