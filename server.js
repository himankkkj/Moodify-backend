import app from './src/app.js';
import connectToDb from './src/config/databse.js';

connectToDb();

app.listen(3000, () => {
    console.log('Server is running on port 3000');
})