



const readenvironmentconfig = () => {
    try {
        const isProduction = process.env.NODE_ENV === 'production';
        console.log("Isproduction: ", isProduction);
        // Set URLs based on environment
        const BASE_URL = isProduction ? 'https://www.qrmypro.com' : 'http://localhost:3030';
        const GOOGLE_CALLBACK_URL = `${BASE_URL}/auth/google/callback`;
        const MONGODB_URI = isProduction ? process.env.MONGODB_URI_PROD : process.env.MONGODB_URI;
        // console.log("GOOGLE_CALLBACK_URL: ", GOOGLE_CALLBACK_URL);
        // console.log("BASE_URL: ", BASE_URL);
        // console.log("Mongodb URI: ", MONGODB_URI);
        let envObject = {
            isProductionEnv: isProduction,
            BASE_URL: isProduction ? 'https://www.qrmypro.com' : 'http://localhost:3030',
            GOOGLE_CALLBACK_URL: `${BASE_URL}/auth/google/callback`,
            MONGODB_URI: isProduction ? process.env.MONGODB_URI_PROD : process.env.MONGODB_URI
        }
        // console.log("envObject: ", envObject);
        return envObject;
    } catch {
        return false;
    }
}


module.exports = { readenvironmentconfig };