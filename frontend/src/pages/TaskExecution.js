import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Table, Modal, Input, Button, message, Typography, Row, Col, Card, Tooltip, Steps,Divider } from 'antd';

const { Title } = Typography;
const { TextArea } = Input;
const { Step } = Steps;
const BASE_URL = 'http://localhost:3000';


const TaskExecution = () => {
  const { id } = useParams();
  const [taskDetails, setTaskDetails] = useState(null);
  const [executionData, setExecutionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchPromptVisible, setMatchPromptVisible] = useState(false);
  const [matchPrompt, setMatchPrompt] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [stepStatus, setStepStatus] = useState(['process', 'wait', 'wait']); 
  const [isExecuting, setIsExecuting] = useState(false);
  const [generateReplyVisible, setGenerateReplyVisible] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [generateStepStatus, setGenerateStepStatus] = useState(['wait', 'wait', 'wait']);
  const [generateCurrentStep, setGenerateCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);


  useEffect(() => {
    fetchTaskDetails();
    fetchExecutionData();
  }, [id]);

  const showMatchPromptModal = async () => {
    try {
      const response = await fetch(`${BASE_URL}/tasks/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const taskData = await response.json();
      setMatchPrompt(taskData.match_prompt || '');
      setMatchPromptVisible(true);
      setStepStatus(['wait', 'wait', 'wait']);
      setCurrentStep(0);
    } catch (error) {
      console.error('Error fetching task data:', error);
      message.error('Failed to load task data');
    }
  };

  const showGenerateReplyModal = async () => {
    try {
      const response = await fetch(`${BASE_URL}/tasks/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const taskData = await response.json();
      setGeneratePrompt(taskData.generate_prompt || '');
      setGenerateReplyVisible(true);
      setGenerateStepStatus(['wait', 'wait', 'wait']);
      setGenerateCurrentStep(0);
    } catch (error) {
      console.error('Error fetching task data:', error);
      message.error('Failed to load task data');
    }
  };

  // 定义 makeAIRequest 和 saveAIResult 的函数（或者从其他模块引入）
const makeAIRequest = async (taskData, matchPrompt) => {
    // 实现与 AI 的交互逻辑
    // 示例：发送 POST 请求到你的 AI 服务端
    const response = await fetch(`${BASE_URL}/ai/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ taskData, prompt: matchPrompt }),
    });
  
    if (!response.ok) {
      throw new Error('AI request failed');
    }
  
    return await response.json();
  };
  
  const saveAIResult = async (aiResult) => {
    // 实现保存结果的逻辑
    const response = await fetch(`${BASE_URL}/tasks/save-result`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(aiResult),
    });
  
    if (!response.ok) {
      throw new Error('Failed to save AI result');
    }
  };

  const handleMatchPromptOk = async () => {
    if (isExecuting) return;
    setIsExecuting(true);
    try {
      // Step 1: 获取任务推广标的与网罗帖子
      setStepStatus(['process', 'wait', 'wait']);
      setCurrentStep(0);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟API调用
      setStepStatus(['finish', 'process', 'wait']);
      setCurrentStep(1);

      // Step 2: 拼装prompt进行AI请求
      const response = await fetch(`${BASE_URL}/tasks/${id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchPrompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to execute task');
      }

      setStepStatus(['finish', 'finish', 'process']);
      setCurrentStep(2);

      // Step 3: 获取AI返回结果并存储
      const result = await response.json();
      if (result.success) {
        setStepStatus(['finish', 'finish', 'finish']);
        message.success(result.message);
        
        // 更新数据库中的 match_prompt
        await updateMatchPrompt();
        
        setTimeout(() => {
          setMatchPromptVisible(false);
          fetchExecutionData();
        }, 1000);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error during task execution:', error);
      message.error('任务执行失败');
      setStepStatus(['error', 'error', 'error']);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleGenerateReplyOk = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      setGenerateStepStatus(['process', 'wait', 'wait']);
      setGenerateCurrentStep(0);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setGenerateStepStatus(['finish', 'process', 'wait']);
      setGenerateCurrentStep(1);

      const response = await fetch(`${BASE_URL}/tasks/${id}/generate-replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generatePrompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate replies');
      }

      setGenerateStepStatus(['finish', 'finish', 'process']);
      setGenerateCurrentStep(2);

      const result = await response.json();
      if (result.success) {
        setGenerateStepStatus(['finish', 'finish', 'finish']);
        message.success(result.message);
        
        await updateGeneratePrompt();
        
        setTimeout(() => {
          setGenerateReplyVisible(false);
          fetchExecutionData();
        }, 1000);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error during reply generation:', error);
      message.error('Reply generation failed');
      setGenerateStepStatus(['error', 'error', 'error']);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const updateMatchPrompt = async () => {
    try {
      const response = await fetch(`${BASE_URL}/tasks/${id}/match-prompt`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchPrompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to update match prompt');
      }
    } catch (error) {
      console.error('Error updating match prompt:', error);
      message.error('Failed to update match prompt');
    }
  };
  
  const updateGeneratePrompt = async () => {
    try {
      const response = await fetch(`${BASE_URL}/tasks/${id}/generate-prompt`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generatePrompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to update generate prompt');
      }
    } catch (error) {
      console.error('Error updating generate prompt:', error);
      message.error('Failed to update generate prompt');
    }
  };

  const handleMatchPromptCancel = () => {
    setMatchPromptVisible(false);
  };

  const handleGenerateReplyCancel = () => {
    setGenerateReplyVisible(false);
  };

  const fetchTaskDetails = async () => {
    try {
      const response = await fetch(`${BASE_URL}/tasks/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setTaskDetails(data);
    } catch (error) {
      console.error('Error fetching task details:', error);
      message.error('Failed to fetch task details');
    }
  };

  const fetchExecutionData = async () => {
    try {
      const response = await fetch(`${BASE_URL}/tasks/${id}/execution`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Execution data fetched:', data); // 添加调试日志
      setExecutionData(data);
    } catch (error) {
      console.error('Error fetching execution data:', error);
      message.error('Failed to fetch execution data');
    } finally {
      setLoading(false);
    }
  };  

  const handleMatch = async () => {
    try {
      await fetch(`${BASE_URL}/tasks/${id}/match`, { method: 'POST' });
      message.success('Matching completed');
      fetchExecutionData();
    } catch (error) {
      console.error('Error during matching:', error);
      message.error('Failed to perform matching');
    }
  };

  const handleGenerateReplies = async () => {
    try {
      await fetch(`${BASE_URL}/tasks/${id}/generate-replies`, { method: 'POST' });
      message.success('Replies generated');
      fetchExecutionData();
    } catch (error) {
      console.error('Error generating replies:', error);
      message.error('Failed to generate replies');
    }
  };

  const handlePublishReplies = async () => {
    try {
      await fetch(`${BASE_URL}/tasks/${id}/publish-replies`, { method: 'POST' });
      message.success('Replies published');
      fetchExecutionData();
    } catch (error) {
      console.error('Error publishing replies:', error);
      message.error('Failed to publish replies');
    }
  };

  const handleDelete = async (executionId) => {
    try {
      await fetch(`${BASE_URL}/task-executions/${executionId}`, { method: 'DELETE' });
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

  const truncateText = (text, length) => {
    if (text.length <= length) return text;
    return `${text.slice(0, length)}...`;
  };

  return (
    <div className="task-execution-container">
      <Row gutter={16} style={{ marginBottom: 16 }} align="middle" justify="space-between">
        <Col span={24}>
        <Card className="task-info-card" style={{ body: { padding: '12px 24px' } }}>
            <Row gutter={16} align="middle">
              <Col>
                <Tooltip title={taskDetails?.name}>
                  <span style={{ fontWeight: 'bold' }}>
                    {truncateText(taskDetails?.name || '', 8)}
                  </span>
                </Tooltip>
              </Col>
              <Divider type="vertical" style={{ height: '20px', margin: '0 16px' }} />
              <Col><strong>推广标的数:</strong> {taskDetails?.promotion_count || '-'}</Col>
              <Col><strong>网罗帖子数:</strong> {taskDetails?.post_count || '-'}</Col>
              <Col><strong>匹配数:</strong> {executionData.length || '-'}</Col>
            </Row>
          </Card>
        </Col>
        <Col span={24} style={{ marginTop: 16, textAlign: 'right' }}>
          <Button type="primary" onClick={showMatchPromptModal} style={{ marginRight: 8 }}>进行匹配</Button>
          <Button onClick={showGenerateReplyModal} style={{ marginRight: 8 }}>生成跟帖</Button>
          <Button onClick={handlePublishReplies}>发布跟帖</Button>
        </Col>
      </Row>

      <Modal
        title="匹配推广标的与网罗帖子"
        visible={matchPromptVisible}
        onOk={handleMatchPromptOk}
        onCancel={handleMatchPromptCancel}
        width={900}
        confirmLoading={isExecuting}
      >
        <Steps current={currentStep} style={{ marginBottom: 16 }}>
          <Step title="获取任务推广标的与网罗帖子" status={stepStatus[0]} />
          <Step title="拼装prompt进行AI请求" status={stepStatus[1]} />
          <Step title="获取AI返回结果并存储" status={stepStatus[2]} />
        </Steps>
        <TextArea
          value={matchPrompt}
          onChange={(e) => setMatchPrompt(e.target.value)}
          placeholder="Enter matching prompt"
          autoSize={{ minRows: 4, maxRows: 8 }}
          disabled={isExecuting}
        />
      </Modal>

      <Modal
        title="生成跟帖"
        visible={generateReplyVisible}
        onOk={handleGenerateReplyOk}
        onCancel={handleGenerateReplyCancel}
        width={900}
        confirmLoading={isGenerating}
      >
        <Steps current={generateCurrentStep} style={{ marginBottom: 16 }}>
          <Step title="获取任务推广标的与网罗帖子" status={generateStepStatus[0]} />
          <Step title="拼装prompt进行AI请求" status={generateStepStatus[1]} />
          <Step title="获取AI返回结果并存储" status={generateStepStatus[2]} />
        </Steps>
        <TextArea
          value={generatePrompt}
          onChange={(e) => setGeneratePrompt(e.target.value)}
          placeholder="Enter generate prompt"
          autoSize={{ minRows: 4, maxRows: 8 }}
          disabled={isGenerating}
        />
      </Modal>

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