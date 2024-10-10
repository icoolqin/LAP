// HotPosts.tsx
import React, { useEffect, useState } from 'react';
import { Table, Button, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';

interface HotItem {
  id: string;
  time: number;
  title: string;
  domain: string;
  views: number;
  url: string;
}

interface FetchResponse {
  success: boolean;
  error?: string;
}

interface LoadResponse {
  items: HotItem[];
}

const HotPosts: React.FC = () => {
  const [data, setData] = useState<HotItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchHotItems = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/update-hot-items');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const result: FetchResponse = await response.json();
      if (result.success) {
        await loadHotItems();
        message.success('热点数据已更新');
      } else {
        throw new Error(result.error || 'Failed to update hot items');
      }
    } catch (error) {
      if (error instanceof Error) {
        message.error(`拉取热点失败: ${error.message}`);
        console.error('Error fetching hot items:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadHotItems = async (): Promise<void> => {
    try {
      const response = await fetch('http://localhost:3000/get-hot-items');
      const result: LoadResponse = await response.json();
      setData(result.items || []);
    } catch (error) {
      console.error('Error loading hot items:', error);
    }
  };

  useEffect(() => {
    loadHotItems();
  }, []);

  const columns: TableColumnsType<HotItem> = [
    {
      title: 'Date',
      dataIndex: 'time',
      key: 'time',
      render: (text: number) => {
        const date = new Date(text * 1000);
        return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
      },
      ellipsis: true,
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: 'Domain',
      dataIndex: 'domain',
      key: 'domain',
      ellipsis: true,
    },
    {
      title: 'Views',
      dataIndex: 'views',
      key: 'views',
      ellipsis: true,
    },
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      render: (text: string) => {
        const maxLength = 25;
        const displayText = text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
        return (
          <a href={text} target="_blank" rel="noopener noreferrer" title={text}>
            {displayText}
          </a>
        );
      },
    },
  ];

  return (
    <div className="hot-posts-container">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button type="primary" icon={<ReloadOutlined />} loading={loading} onClick={fetchHotItems}>
          拉取热点
        </Button>
      </div>
      <Table columns={columns} dataSource={data} rowKey="id" />
    </div>
  );
};

export default HotPosts;