import dotenv from 'dotenv';
import dns from 'dns';

// Use Google DNS to resolve MongoDB Atlas SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config({ path: '../.env' });
