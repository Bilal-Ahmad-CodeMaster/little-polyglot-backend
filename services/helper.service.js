const setResponse = (res, { type, message, data = null }) => {
  let statusCode = 200;

  switch (type) {
    case "success":
      statusCode = 200;
      return res.status(statusCode).json({
        status: "success",
        message,
        data,
      });
    case "error":
      statusCode = 500;
      return res.status(statusCode).json({
        status: "error",
        message,
        data,
      });
    case "bad":
      statusCode = 400;
      return res.status(statusCode).json({
        status: "fail",
        message,
        data,
      });
    case "unauthorized":
      statusCode = 401;
      return res.status(statusCode).json({
        status: "unauthorized",
        message,
        data,
      });
    case "notFound":
      statusCode = 404;
      return res.status(statusCode).json({
        status: "Not Found",
        message,
        data,
      });
    default:
      return res.status(statusCode).json({
        status: "unknown",
        message: "Unknown response type",
        data,
      });
  }
};

export default setResponse;
