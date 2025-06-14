import type { Request, Response } from 'express';

const getMockRequest = (): Request => ({}) as unknown as Request;
const getMockResponse = (): Response => ({}) as unknown as Response;

export { getMockRequest, getMockResponse };
