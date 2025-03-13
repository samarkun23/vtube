//Making mongo DB connection 

const asyncHandler = (requestHandler) => {
    (req, res,next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}
//catch jo hai vo reject ka hi hai


export {asyncHandler}



// This is secound method you use both

/*
const asyncHandler = (fn) => async (req, res, next) => {
    try {
       await fn(req, res, next) 
    } catch (error) {
       res.status(error.code || 500.json({
        success:false,
        message: error.message
       })) 
    }
}*/