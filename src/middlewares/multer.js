const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, '/Public/Temp')
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
  })
  
  const upload = multer({ storage })