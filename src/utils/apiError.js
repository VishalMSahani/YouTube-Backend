class ApiError extends Error{
    constructor(
        statusCode,
        message= "Something went Wrong",
        error = [],
        stack = " "
    ){
        super(message);
        this.statusCode = statusCode;
        this.data = null
        this.error = error;
        this.message = message;
        this.success = false;

        // if (stack) {
        //     this.stack = stack
        // } else {
        //     Error.captureStackTrace(this, this.constructor)
        // }
     }
}

export {ApiError}