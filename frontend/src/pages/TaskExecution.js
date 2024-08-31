import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Table, Button, message, Typography, Row, Col, Card } from 'antd';

const { Title } = Typography;

const TaskExecution = () => {
  const { id } = useParams();
  const [taskDetails, setTaskDetails] = useState(null);
  const [executionData, setExecutionData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTaskDetails();
    fetchExecutionData();
  }, [id]);

  const fetchTaskDetails = async () => {
    try {
      const response = await fetch(`/tasks/${id}`);
      const data = await response.json();
      setTaskDetails(data);
    } catch (error) {
      console.error('Error fetching task details:', error);
      message.error('Failed to fetch task details');
    }
  };

  const fetchExecutionData = async () => {
    try {
      const response = await fetch(`/tasks/${id}/execution`);
      const data = await response.json();
      setExecutionData(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching execution data:', error);
      message.error('Failed to fetch execution data');
      setLoading(false);
    }
  };

  const handleMatch = async () => {
    try {
      await fetch(`/tasks/${id}/match`, { method: 'POST' });
      message.success('Matching completed');
      fetchExecutionData();
    } catch (error) {
      console.error('Error during matching:', error);
      message.error('Failed to perform matching');
    }
  };

  const handleGenerateReplies = async () => {
    try {
      await fetch(`/tasks/${id}/generate-replies`, { method: 'POST' });
      message.success('Replies generated');
      fetchExecutionData();
    } catch (error) {
      console.error('Error generating replies:', error);
      message.error('Failed to generate replies');
    }
  };

  const handlePublishReplies = async () => {
    try {
      await fetch(`/tasks/${id}/publish-replies`, { method: 'POST' });
      message.success('Replies published');
      fetchExecutionData();
    } catch (error) {
      console.error('Error publishing replies:', error);
      message.error('Failed to publish replies');
    }
  };

  const handleDelete = async (executionId) => {
    try {
      await fetch(`/task-executions/${executionId}`, { method: 'DELETE' });
      message.success('Execution record deleted');
      fetchExecutionData();
    } catch (error) {
      console.error('Error deleting execution record:', error);
      message.error('Failed to delete execution record');
    }
  };

  const columns = [
    { title: '推广标的', dataIndex: 'promotionItemName', key: 'promotionItemName' },
    { title: '网罗帖子', dataIndex: 'hotPostTitle', key: 'hotPostTitle' },
    { 
      title: '帖子URL', 
      dataIndex: 'hotPostUrl', 
      key: 'hotPostUrl', 
      render: (text) => (
        <a href={text} target="_blank" rel="noopener noreferrer">
          {text}
        </a>
      ) 
    },
    { title: '生成跟帖', dataIndex: 'generatedReply', key: 'generatedReply' },
    { title: '生成时间', dataIndex: 'generatedTime', key: 'generatedTime' },
    { title: '发布robot', dataIndex: 'robotName', key: 'robotName' },
    { title: '发布时间', dataIndex: 'publishTime', key: 'publishTime' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <span>
          <Button onClick={() => handleGenerateReplies(record.id)} size="small" style={{ marginRight: '8px' }}>生成跟帖</Button>
          <Button onClick={() => handlePublishReplies(record.id)} size="small" style={{ marginRight: '8px' }}>发布跟帖</Button>
          <Button danger onClick={() => handleDelete(record.id)} size="small">删除</Button>
        </span>
      ),
    },
  ];

  return (
    <div className="task-execution-container">
      <Title level={2}>{taskDetails?.name || '任务执行'}</Title>

      <Row gutter={16} style={{ marginBottom: 16 }} align="middle" justify="space-between">
        <Col>
          <Card className="task-info-card" bodyStyle={{ padding: '12px 24px' }}>
            <Row gutter={16}>
              <Col><strong>推广标的数:</strong> {taskDetails?.promotion_count || '-'}</Col>
              <Col><strong>网罗帖子数:</strong> {taskDetails?.post_count || '-'}</Col>
              <Col><strong>匹配数:</strong> {executionData.length || '-'}</Col>
            </Row>
          </Card>
        </Col>
        <Col>
          <Button type="primary" onClick={handleMatch} style={{ marginRight: 8 }}>进行匹配</Button>
          <Button onClick={handleGenerateReplies} style={{ marginRight: 8 }}>生成跟帖</Button>
          <Button onClick={handlePublishReplies}>发布跟帖</Button>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={executionData}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
};

export default TaskExecution;