const express = require('express');
const router = express.Router();

const app = express();

router.get('/', (req,res) =>{
    res.send('Server OK');
});

module.exports = router;