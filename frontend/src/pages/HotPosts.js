// src/pages/HotPosts.js
import React, { useEffect, useState } from 'react';
import { Table, Button, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

const HotPosts = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Function to fetch hot items from backend
  const fetchHotItems = async (showMessage = false) => {
    setLoading(true);
    try {
      const response = await fetch('/get-hot-items');
      const result = await response.json();
      setData(result.items);
      if (showMessage) {
        message.success('热点数据已更新');
      }
    } catch (error) {
      if (showMessage) {
        message.error('拉取热点失败');
      }
      console.error('Error fetching hot items:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch of hot items without showing a message
  useEffect(() => {
    fetchHotItems(false);
  }, []);

  const columns = [
    { title: 'Title', dataIndex: 'title', key: 'title' },
    { title: 'Domain', dataIndex: 'domain', key: 'domain' },
    { title: 'Views', dataIndex: 'views', key: 'views' },
    { title: 'URL', dataIndex: 'url', key: 'url', render: (text) => <a href={text} target="_blank" rel="noopener noreferrer">{text}</a> },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button type="primary" icon={<ReloadOutlined />} loading={loading} onClick={() => fetchHotItems(true)}>
          拉取热点
        </Button>
      </div>
      <Table columns={columns} dataSource={data} rowKey="id" />
    </div>
  );
};

export default HotPosts;
