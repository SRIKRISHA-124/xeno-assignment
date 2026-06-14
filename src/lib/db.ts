import fs from 'fs';
import path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Types
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  last_order_date: string;
  total_spent: number;
  order_count: number;
  created_at: string;
}

export interface Order {
  id: string;
  customer_id: string;
  amount: number;
  status: string;
  created_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  intent: string;
  segment_filters: any;
  channel: 'whatsapp' | 'sms' | 'email';
  message_template: string;
  scheduled_time: string;
  status: 'draft' | 'sending' | 'completed';
  created_at: string;
}

export interface DeliveryStatus {
  id: string;
  campaign_id: string;
  customer_id: string;
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed';
  error_message: string | null;
  updated_at: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_city?: string;
}

// Database file path for local SQLite-like JSON DB
const DB_FILE_PATH = path.join(process.cwd(), 'reach-iq-db.json');

// Initialize Supabase if credentials are provided
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

let supabase: SupabaseClient | null = null;
if (isSupabaseConfigured) {
  supabase = createClient(supabaseUrl!, supabaseAnonKey!);
}

// Local Database Engine
class LocalDB {
  private data: {
    customers: Customer[];
    orders: Order[];
    campaigns: Campaign[];
    delivery_status: DeliveryStatus[];
  } = {
    customers: [],
    orders: [],
    campaigns: [],
    delivery_status: []
  };

  constructor() {
    this.load();
  }

  private load() {
    if (fs.existsSync(DB_FILE_PATH)) {
      try {
        const fileContent = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        this.data = JSON.parse(fileContent);
      } catch (e) {
        console.error("Failed to parse local DB, seeding new one...", e);
        this.seed();
      }
    } else {
      console.log("Local database file not found. Seeding initial data...");
      this.seed();
    }
  }

  public save() {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  private seed() {
    console.log("Seeding local database with 500 customers and 2000+ orders...");

    const firstNames = [
      'Aarav', 'Vihaan', 'Aditya', 'Arjun', 'Priyanka', 'Ananya', 'Diya', 'Rahul', 'Rohan', 'Vikram',
      'Sneha', 'Tanvi', 'Neha', 'Riya', 'Ishaan', 'Kabir', 'Siddharth', 'Karan', 'Dev', 'Sai',
      'Reyansh', 'Pranav', 'Aanya', 'Kiara', 'Myra', 'Ira', 'Avani', 'Zara', 'Meera', 'Rohan'
    ];
    const lastNames = [
      'Sharma', 'Patel', 'Rao', 'Nair', 'Reddy', 'Sen', 'Iyer', 'Verma', 'Gupta', 'Singh',
      'Kulkarni', 'Joshi', 'Bhat', 'Mukherjee', 'Kapoor', 'Mehta', 'Choudhury', 'Prasad', 'Pillai', 'Jadhav',
      'Nambiar', 'Dubey', 'Trivedi', 'Bose', 'Menon', 'Shah', 'Pandey', 'Saxena', 'Deshmukh', 'Das'
    ];
    const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow'];

    const customers: Customer[] = [];
    const orders: Order[] = [];

    const now = new Date();

    for (let i = 1; i <= 500; i++) {
      const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const name = `${fName} ${lName}`;
      const email = `${fName.toLowerCase()}.${lName.toLowerCase()}.${i}@example.in`;
      const phone = `+91 ${9000000000 + i}`;
      const city = cities[Math.floor(Math.random() * cities.length)];

      // Order parameters
      const orderCount = Math.floor(Math.random() * 12) + 1; // 1 to 12 orders
      let customerTotalSpent = 0;
      let latestOrderDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); // start from 1 year ago

      for (let j = 0; j < orderCount; j++) {
        // distribute order dates over the last 12 months
        // random offset in ms up to 365 days
        const dateOffset = Math.random() * 365 * 24 * 60 * 60 * 1000;
        const orderDate = new Date(now.getTime() - dateOffset);
        
        if (orderDate > latestOrderDate) {
          latestOrderDate = orderDate;
        }

        // Amount distributed between ₹500 and ₹5,000 per order
        const amount = Math.floor(Math.random() * 4500) + 500;
        customerTotalSpent += amount;

        orders.push({
          id: `ord_${i}_${j}`,
          customer_id: `cust_${i}`,
          amount,
          status: 'completed',
          created_at: orderDate.toISOString()
        });
      }

      // Ensure total spent is overall between ₹500 and ₹50,000
      // If it exceeds ₹50,000, we clamp/scale it down
      if (customerTotalSpent > 50000) {
        const factor = 50000 / customerTotalSpent;
        customerTotalSpent = 0;
        orders.filter(o => o.customer_id === `cust_${i}`).forEach(o => {
          o.amount = Math.floor(o.amount * factor);
          customerTotalSpent += o.amount;
        });
      }

      customers.push({
        id: `cust_${i}`,
        name,
        email,
        phone,
        city,
        last_order_date: latestOrderDate.toISOString(),
        total_spent: customerTotalSpent,
        order_count: orderCount,
        created_at: new Date(now.getTime() - Math.random() * 500 * 24 * 60 * 60 * 1000).toISOString() // registration date
      });
    }

    this.data.customers = customers;
    this.data.orders = orders;
    this.data.campaigns = [
      {
        id: 'camp_demo',
        name: 'Welcome Premium Members',
        intent: 'Contact high spenders to welcome them',
        segment_filters: { total_spent: 10000 },
        channel: 'whatsapp',
        message_template: 'Hey {{name}}, thanks for being a valued customer! Get a free coffee on us.',
        scheduled_time: new Date().toISOString(),
        status: 'completed',
        created_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Seed some delivery status callbacks for the demo campaign
    // pick 10 random customers
    for (let k = 0; k < 10; k++) {
      const custIndex = Math.floor(Math.random() * customers.length);
      const cust = customers[custIndex];
      const statuses: ('sent'|'delivered'|'opened'|'clicked')[] = ['sent', 'delivered', 'opened', 'clicked'];
      const maxStatusIndex = Math.floor(Math.random() * statuses.length);
      
      this.data.delivery_status.push({
        id: `ds_${cust.id}_camp_demo`,
        campaign_id: 'camp_demo',
        customer_id: cust.id,
        status: statuses[maxStatusIndex],
        error_message: null,
        updated_at: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    this.save();
    console.log(`Successfully seeded ${this.data.customers.length} customers and ${this.data.orders.length} orders.`);
  }

  public getCustomers(filters?: { minSpent?: number; maxSpent?: number; city?: string; inactiveDays?: number }) {
    let result = [...this.data.customers];

    if (filters) {
      if (filters.minSpent !== undefined) {
        result = result.filter(c => c.total_spent >= filters.minSpent!);
      }
      if (filters.maxSpent !== undefined) {
        result = result.filter(c => c.total_spent <= filters.maxSpent!);
      }
      if (filters.city) {
        result = result.filter(c => c.city.toLowerCase() === filters.city!.toLowerCase());
      }
      if (filters.inactiveDays !== undefined) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - filters.inactiveDays!);
        result = result.filter(c => new Date(c.last_order_date) <= cutoffDate);
      }
    }

    return result;
  }

  public getOrders() {
    return this.data.orders;
  }

  public getCampaigns() {
    // Return campaigns sorted by created_at desc
    return [...this.data.campaigns].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getCampaignById(id: string) {
    return this.data.campaigns.find(c => c.id === id) || null;
  }

  public createCampaign(campaign: Omit<Campaign, 'id' | 'created_at' | 'status'>) {
    const newCampaign: Campaign = {
      ...campaign,
      id: `camp_${Date.now()}`,
      status: 'draft',
      created_at: new Date().toISOString()
    };
    this.data.campaigns.push(newCampaign);
    this.save();
    return newCampaign;
  }

  public updateCampaignStatus(id: string, status: 'draft' | 'sending' | 'completed') {
    const campaign = this.data.campaigns.find(c => c.id === id);
    if (campaign) {
      campaign.status = status;
      this.save();
    }
  }

  public getDeliveryStatuses(campaignId: string): DeliveryStatus[] {
    const dsList = this.data.delivery_status.filter(ds => ds.campaign_id === campaignId);
    
    // Join with customer details for UI convenience
    return dsList.map(ds => {
      const cust = this.data.customers.find(c => c.id === ds.customer_id);
      return {
        ...ds,
        customer_name: cust ? cust.name : 'Unknown Customer',
        customer_email: cust ? cust.email : '',
        customer_phone: cust ? cust.phone : '',
        customer_city: cust ? cust.city : ''
      };
    });
  }

  public updateDeliveryStatus(campaignId: string, customerId: string, status: DeliveryStatus['status'], errorMessage: string | null) {
    const existingIndex = this.data.delivery_status.findIndex(
      ds => ds.campaign_id === campaignId && ds.customer_id === customerId
    );

    // Enforce idempotency: only update if status is progressing
    // Lifecycle ordering: pending -> sent -> delivered -> opened -> clicked
    // failed is terminal.
    const statusPriority = {
      'pending': 0,
      'sent': 1,
      'delivered': 2,
      'opened': 3,
      'clicked': 4,
      'failed': 5
    };

    if (existingIndex > -1) {
      const existing = this.data.delivery_status[existingIndex];
      // If the incoming status is terminal or higher priority than the existing one, update it
      if (statusPriority[status] > statusPriority[existing.status]) {
        existing.status = status;
        existing.error_message = errorMessage;
        existing.updated_at = new Date().toISOString();
      }
    } else {
      // Create new record
      this.data.delivery_status.push({
        id: `ds_${customerId}_${campaignId}`,
        campaign_id: campaignId,
        customer_id: customerId,
        status: status,
        error_message: errorMessage,
        updated_at: new Date().toISOString()
      });
    }
    
    this.save();
  }

  public getMetrics() {
    const totalRevenue = this.data.customers.reduce((sum, c) => sum + c.total_spent, 0);
    const totalCustomers = this.data.customers.length;
    const totalCampaigns = this.data.campaigns.length;

    // Delivery stats conversion calculations
    const allStatuses = this.data.delivery_status;
    const sent = allStatuses.filter(s => ['sent', 'delivered', 'opened', 'clicked'].includes(s.status)).length;
    const delivered = allStatuses.filter(s => ['delivered', 'opened', 'clicked'].includes(s.status)).length;
    const opened = allStatuses.filter(s => ['opened', 'clicked'].includes(s.status)).length;
    const clicked = allStatuses.filter(s => s.status === 'clicked').length;
    const failed = allStatuses.filter(s => s.status === 'failed').length;

    const deliveryRate = sent > 0 ? (delivered / sent) * 100 : 0;
    const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;
    const clickRate = opened > 0 ? (clicked / opened) * 100 : 0;

    return {
      totalRevenue,
      totalCustomers,
      totalCampaigns,
      sent,
      delivered,
      opened,
      clicked,
      failed,
      deliveryRate,
      openRate,
      clickRate
    };
  }
}

export const localDB = new LocalDB();

// Unified DB Adapter Methods
export const db = {
  // Customers
  async getCustomers(filters?: { minSpent?: number; maxSpent?: number; city?: string; inactiveDays?: number }) {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('customers').select('*');
      if (filters) {
        if (filters.minSpent !== undefined) query = query.gte('total_spent', filters.minSpent);
        if (filters.maxSpent !== undefined) query = query.lte('total_spent', filters.maxSpent);
        if (filters.city) query = query.eq('city', filters.city);
        if (filters.inactiveDays !== undefined) {
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - filters.inactiveDays);
          query = query.lte('last_order_date', cutoff.toISOString());
        }
      }
      const { data, error } = await query.order('name');
      if (error) throw error;
      return data as Customer[];
    } else {
      return localDB.getCustomers(filters);
    }
  },

  // Orders
  async getOrders() {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Order[];
    } else {
      return localDB.getOrders();
    }
  },

  // Campaigns
  async getCampaigns() {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Campaign[];
    } else {
      return localDB.getCampaigns();
    }
  },

  async getCampaignById(id: string) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('campaigns').select('*').eq('id', id).single();
      if (error) throw error;
      return data as Campaign;
    } else {
      return localDB.getCampaignById(id);
    }
  },

  async createCampaign(campaign: Omit<Campaign, 'id' | 'created_at' | 'status'>) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('campaigns').insert([{
        name: campaign.name,
        intent: campaign.intent,
        segment_filters: campaign.segment_filters,
        channel: campaign.channel,
        message_template: campaign.message_template,
        scheduled_time: campaign.scheduled_time,
        status: 'draft'
      }]).select().single();
      if (error) throw error;
      return data as Campaign;
    } else {
      return localDB.createCampaign(campaign);
    }
  },

  async updateCampaignStatus(id: string, status: 'draft' | 'sending' | 'completed') {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('campaigns').update({ status }).eq('id', id);
      if (error) throw error;
    } else {
      localDB.updateCampaignStatus(id, status);
    }
  },

  // Delivery status tracking
  async getDeliveryStatuses(campaignId: string) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('delivery_status')
        .select(`
          *,
          customers:customer_id (
            name,
            email,
            phone,
            city
          )
        `)
        .eq('campaign_id', campaignId);
        
      if (error) throw error;

      return data.map((ds: any) => ({
        id: ds.id,
        campaign_id: ds.campaign_id,
        customer_id: ds.customer_id,
        status: ds.status,
        error_message: ds.error_message,
        updated_at: ds.updated_at,
        customer_name: ds.customers?.name || 'Unknown',
        customer_email: ds.customers?.email || '',
        customer_phone: ds.customers?.phone || '',
        customer_city: ds.customers?.city || ''
      })) as DeliveryStatus[];
    } else {
      return localDB.getDeliveryStatuses(campaignId);
    }
  },

  async updateDeliveryStatus(campaignId: string, customerId: string, status: DeliveryStatus['status'], errorMessage: string | null) {
    if (isSupabaseConfigured && supabase) {
      // Idempotent upsert logic with ON CONFLICT (campaign_id, customer_id) DO UPDATE in Postgres
      const { error } = await supabase.rpc('upsert_delivery_status', {
        p_campaign_id: campaignId,
        p_customer_id: customerId,
        p_status: status,
        p_error_message: errorMessage
      });

      // Fallback in case RPC is not yet created
      if (error) {
        // Run direct standard upsert on Supabase (delivery_status has unique constraint on campaign_id, customer_id)
        const { error: upsertError } = await supabase
          .from('delivery_status')
          .upsert({
            campaign_id: campaignId,
            customer_id: customerId,
            status: status,
            error_message: errorMessage,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'campaign_id,customer_id'
          });
          
        if (upsertError) console.error("Supabase upsert failed:", upsertError);
      }
    } else {
      localDB.updateDeliveryStatus(campaignId, customerId, status, errorMessage);
    }
  },

  // High level dashboard aggregates
  async getMetrics() {
    if (isSupabaseConfigured && supabase) {
      // Query database for metrics
      // To keep serverless lightweight, we can aggregate customers & delivery status
      const { data: customerData, error: cErr } = await supabase.from('customers').select('total_spent');
      if (cErr) throw cErr;
      
      const { data: campaignCount, count: campCount, error: campErr } = await supabase.from('campaigns').select('id', { count: 'exact' });
      if (campErr) throw campErr;

      const { data: dsData, error: dsErr } = await supabase.from('delivery_status').select('status');
      if (dsErr) throw dsErr;

      const totalRevenue = (customerData || []).reduce((sum, c) => sum + Number(c.total_spent), 0);
      const totalCustomers = customerData?.length || 0;
      const totalCampaigns = campCount || 0;

      const sent = dsData.filter((s: any) => ['sent', 'delivered', 'opened', 'clicked'].includes(s.status)).length;
      const delivered = dsData.filter((s: any) => ['delivered', 'opened', 'clicked'].includes(s.status)).length;
      const opened = dsData.filter((s: any) => ['opened', 'clicked'].includes(s.status)).length;
      const clicked = dsData.filter((s: any) => s.status === 'clicked').length;
      const failed = dsData.filter((s: any) => s.status === 'failed').length;

      const deliveryRate = sent > 0 ? (delivered / sent) * 100 : 0;
      const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;
      const clickRate = opened > 0 ? (clicked / opened) * 100 : 0;

      return {
        totalRevenue,
        totalCustomers,
        totalCampaigns,
        sent,
        delivered,
        opened,
        clicked,
        failed,
        deliveryRate,
        openRate,
        clickRate
      };
    } else {
      return localDB.getMetrics();
    }
  }
};
