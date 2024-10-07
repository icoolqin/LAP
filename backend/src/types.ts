// types.ts
export interface TrendingTopic {
    id: string;
    title: string;
    thumbnail: string;
    url: string;
    md5: string;
    extra: string;
    time: string;
    nodeids: string;
    topicid: string;
    domain: string;
    sitename: string;
    logo: string;
    views: string;
  }
  
  export interface PromotionItem {
    id?: number;
    created_at: string;
    name: string;
    description: string;
    method: string;
    type: string;
    additional_info: string;
    status: string;
  }
  
  export interface Task {
    id?: number;
    created_at: string;
    name: string;
    promotion_count: number;
    post_count: number;
    match_count: number;
    stage: string;
    match_prompt?: string;
    generate_prompt?: string;
  }
  
  export interface TaskExecution {
    id?: number;
    task_id: number;
    promotion_item_id: number;
    hot_post_id: string;
    generated_reply: string;
    generated_time: string;
    robot_id: number | null;
    account_id: number | null;
    publish_time: string | null;
    status: string;
  }
  
  export interface Account {
    id: number;
    website_name: string;
    website_domain: string;
    account_status: string;
    playwright_login_state: string;
    login_state_update_time: string;
    login_state_suggested_update_interval: string;
    last_used_time: string;
    account_username: string;
    account_password: string;
    account_bound_phone_number: string;
    account_last_update_time: string;
    recent_login_screenshot: string;
    remarks: string;
  }