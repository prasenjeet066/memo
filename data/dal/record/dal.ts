/**
 * Record Access Layer
 * 
 */
 
export default class RecordDAL {
   static async getAllRecord():Promise<{
     response?: [];
     error?:string;
   }>{
     try {
       await connectDB()
       
     } catch (e) {
       return {
         error: 'Connection Failed!'
       }
     }
   }
 }