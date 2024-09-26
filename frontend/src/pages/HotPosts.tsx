import React, { useEffect, useState } from 'react';
import { Table, Button, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

const HotPosts = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchHotItems = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/update-hot-items');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const result = await response.json();
      if (result.success) {
        await loadHotItems();
        message.success('热点数据已更新');
      } else {
        throw new Error(result.error || 'Failed to update hot items');
      }
    } catch (error) {
      message.error(`拉取热点失败: ${error.message}`);
      console.error('Error fetching hot items:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHotItems = async () => {
    try {
      const response = await fetch('http://localhost:3000/get-hot-items');
      const result = await response.json();
      setData(result.items || []);
    } catch (error) {
      console.error('Error loading hot items:', error);
    }
  };

  useEffect(() => {
    loadHotItems();
  }, []);

  const columns = [
    {
        title: 'Date',
        dataIndex: 'time',
        key: 'time',
        render: (text) => {
          const date = new Date(text * 1000); // 将时间戳转换为毫秒
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
      render: (text) => {
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
