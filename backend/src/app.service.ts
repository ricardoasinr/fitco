import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'FITCO Wellness Platform API - Running';
  }
}

