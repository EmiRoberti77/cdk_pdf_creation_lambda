import * as dotenv from "dotenv";
dotenv.config();
export const V = process.env.V!;
export const PROJECT = process.env.PROJECT_NAME!;
export const pdfMakerLambdaName = `${PROJECT}pdfMakerLambda${V}`;
export const apiName = `${PROJECT}pdfMakerApi${V}`;
