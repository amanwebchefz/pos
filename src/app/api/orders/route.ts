import axios from 'axios';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const backendResponse = await axios.post('http://localhost:3001/orders', body);
    return NextResponse.json(backendResponse.data, { status: backendResponse.status });
  } catch (error: any) {
    const status = error.response?.status || 500;
    const data = error.response?.data || { message: 'Internal Server Error' };
    return NextResponse.json(data, { status });
  }
}
