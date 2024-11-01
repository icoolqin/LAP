//TaskExecution.tsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Table, Modal, Input, Button, message, Typography, Popconfirm, Row, Col, Card, Tooltip, Steps, Divider, Space } from 'antd';
import { FormOutlined, SendOutlined, DeleteOutlined, EditOutlined} from '@ant-design/icons';
import moment from 'moment';

const { Title } = Typography;
const { TextArea } = Input;
const { Step } = Steps;
const BASE_URL = 'http://localhost:3000';

interface TaskDetails {
  name: string;
  promotion_count: number;
  post_count: number;
}

interface ExecutionData {
  id: string;
  promotionItemName: string;
  hotPostTitle: string;
  hotPostUrl: string;
  generated_reply: string;
  generated_time: string;
  robotName: string;
  accountName: string;
  publishTime: string | null;
  generate_prompt: string;
}

const TaskExecution: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [taskDetails, setTaskDetails] = useState<TaskDetails | null>(null);
  const [executionData, setExecutionData] = useState<ExecutionData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [matchPromptVisible, setMatchPromptVisible] = useState<boolean>(false);
  const [matchPrompt, setMatchPrompt] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [stepStatus, setStepStatus] = useState<('wait' | 'process' | 'finish' | 'error')[]>(['process', 'wait', 'wait']);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [generateReplyVisible, setGenerateReplyVisible] = useState<boolean>(false);
  const [generatePrompt, setGeneratePrompt] = useState<string>('');
  const [generateStepStatus, setGenerateStepStatus] = useState<('wait' | 'process' | 'finish' | 'error')[]>(['wait', 'wait', 'wait']);
  const [generateCurrentStep, setGenerateCurrentStep] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [loadingPublish, setLoadingPublish] = useState<{ [key: string]: boolean }>({});
  const [editReplyVisible, setEditReplyVisible] = useState<boolean>(false);
  const [editPrompt, setEditPrompt] = useState<string>('');
  const [editReply, setEditReply] = useState<string>('');
  const [loadingGenerateSingleReply, setLoadingGenerateSingleReply] = useState<boolean>(false);
  const [currentEditRecord, setCurrentEditRecord] = useState<ExecutionData | null>(null);

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

  const makeAIRequest = async (taskData: any, matchPrompt: string): Promise<any> => {
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

  const saveAIResult = async (aiResult: any): Promise<void> => {
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
      setStepStatus(['process', 'wait', 'wait']);
      setCurrentStep(0);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStepStatus(['finish', 'process', 'wait']);
      setCurrentStep(1);

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

      const result = await response.json();
      if (result.success) {
        setStepStatus(['finish', 'finish', 'finish']);
        message.success(result.message);
        
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
      console.log('Execution data fetched:', data);
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

  const handleDelete = async (executionId: string) => {
    try {
      await fetch(`${BASE_URL}/task-executions/${executionId}`, { method: 'DELETE' });
      message.success('Execution record deleted');
      fetchExecutionData();
    } catch (error) {
      console.error('Error deleting execution record:', error);
      message.error('Failed to delete execution record');
    }
  };

  // “编辑跟帖”函数
  const handleEditReply = async (record: ExecutionData) => {
    try {
      // 获取当前任务的 generate prompt
      const response = await fetch(`${BASE_URL}/tasks/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const taskData = await response.json();
      
      setEditPrompt(taskData.generate_prompt || ''); // 回显任务级别的生成 prompt
      setEditReply(record.generated_reply || '');
      setCurrentEditRecord(record);
      setEditReplyVisible(true);
    } catch (error) {
      console.error('Error fetching task data:', error);
      message.error('Failed to load task data');
    }
  };

  // 生成跟帖内容
  const handleGenerateSingleReply = async () => {
      if (!currentEditRecord) return;
      setLoadingGenerateSingleReply(true);

      const taskData = {
          promotionItems: [{
              id: currentEditRecord.promotionItemName,
              name: currentEditRecord.promotionItemName,
          }],
          hotPosts: [{
              id: currentEditRecord.hotPostTitle,
              title: currentEditRecord.hotPostTitle,
          }]
      };

      const jsonPlaceholder = "{{json}}";
      let messageContent = editPrompt.includes(jsonPlaceholder)
          ? editPrompt.replace(jsonPlaceholder, JSON.stringify(taskData))
          : `${editPrompt}\n\n${JSON.stringify(taskData)}`;

      try {
          const aiResponse = await fetch(`${BASE_URL}/tasks/${id}/generate-replies`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ generatePrompt: messageContent }),
          });

          if (!aiResponse.ok) throw new Error('AI generation failed');
          const result = await aiResponse.json();
          if (result.success) {
              setEditReply(result.replyContent);
              message.success('Generated reply successfully');
          } else {
              throw new Error(result.message);
          }
      } catch (error) {
          message.error('Failed to generate reply');
          console.error(error);
      } finally {
          setLoadingGenerateSingleReply(false);
      }
  };

  // 保存编辑内容
  const handleSaveReply = async () => {
    if (!currentEditRecord) return;
    try {
      // 1. 更新当前执行记录的回复内容
      const updateReplyResponse = await fetch(`${BASE_URL}/tasks/${currentEditRecord.id}/update-reply`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generated_reply: editReply,
        }),
      });

      if (!updateReplyResponse.ok) throw new Error('Failed to save reply');

      // 2. 更新任务的生成 prompt
      const updatePromptResponse = await fetch(`${BASE_URL}/tasks/${id}/generate-prompt`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generatePrompt: editPrompt,
        }),
      });

      if (!updatePromptResponse.ok) throw new Error('Failed to save generate prompt');

      message.success('Reply and prompt saved successfully');
      setEditReplyVisible(false);
      fetchExecutionData(); // 刷新列表数据
    } catch (error) {
      message.error('Failed to save changes');
      console.error(error);
    }
  };

  // 取消编辑
  const handleCancelEditReply = () => {
      setEditReplyVisible(false);
      setEditPrompt('');
      setEditReply('');
      setCurrentEditRecord(null);
  };

  const ActionButtons: React.FC<{ record: ExecutionData }> = ({ record }) => (
    <Space size="small">
      <Tooltip title="生成跟帖">
        <Button icon={<FormOutlined />} />
      </Tooltip>
      <Tooltip title="发布跟帖">
        <Button
          icon={<SendOutlined />}
          onClick={() => handlePublishReply(record)}
          loading={loadingPublish[record.id]} 
        />
      </Tooltip>
      <Tooltip title="删除">
        <Popconfirm
          title="你确定要删除这条记录吗？"
          onConfirm={() => handleDelete(record.id)}  
          okText="确定"
          cancelText="取消"
        >
          <Button icon={<DeleteOutlined />} danger />
        </Popconfirm>
      </Tooltip>
    </Space>
  );  

  const handlePublishReply = async (record: ExecutionData) => {
    setLoadingPublish(prev => ({ ...prev, [record.id]: true })); 
    try {
      const response = await fetch(`${BASE_URL}/task-executions/${record.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to publish reply');
      }

      const result = await response.json();
      if (result.success) {
        message.success('Reply published successfully');
        fetchExecutionData();
      } else {
        throw new Error(result.error || 'Failed to publish reply');
      }
    } catch (error) {
      console.error('Error publishing reply:', error);
      message.error('Failed to publish reply');
    } finally {
      setLoadingPublish(prev => ({ ...prev, [record.id]: false })); 
    }
  }; 

  const truncateText = (text: string | undefined, length: number): string => {
    if (!text) return '';
    return text.length > length ? `${text.slice(0, length)}...` : text;
  };

  const columns = [
    {
      title: '推广标的',
      dataIndex: 'promotionItemName',
      key: 'promotionItemName',
      ellipsis: {
        showTitle: false,
      },
      render: (text: string) => (
        <Tooltip title={text}>
          {truncateText(text, 20)}
        </Tooltip>
      ),
    },
    {
      title: '网罗帖子',
      dataIndex: 'hotPostTitle',
      key: 'hotPostTitle',
      ellipsis: {
        showTitle: false,
      },
      render: (text: string) => (
        <Tooltip title={text}>
          {truncateText(text, 20)}
        </Tooltip>
      ),
    },
    {
      title: '帖子URL',
      dataIndex: 'hotPostUrl',
      key: 'hotPostUrl',
      ellipsis: {
        showTitle: false,
      },
      render: (text: string) => (
        <Tooltip title={text}>
          <a href={text} target="_blank" rel="noopener noreferrer">
            {truncateText(text, 30)}
          </a>
        </Tooltip>
      ),
    },
    {
      title: '生成跟帖',
      dataIndex: 'generated_reply',
      key: 'generated_reply',
      ellipsis: {
        showTitle: false,
      },
      render: (text: string) => (
        <Tooltip title={text}>
          {truncateText(text, 30)}
        </Tooltip>
      ),
    },
    {
      title: '生成时间',
      dataIndex: 'generated_time',
      key: 'generated_time',
      render: (text: string) => moment(parseInt(text)).format('YYYY-MM-DD HH:mm:ss'),
    },
    { title: '发布robot', dataIndex: 'robotName', key: 'robotName' },
    { title: '发布账号', dataIndex: 'accountName', key: 'accountName' },
    {
      title: '发布时间',
      dataIndex: 'publishTime',
      key: 'publishTime',
      render: (text: string | null) => text ? moment(parseInt(text)).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 140,
      render: (_: any, record: ExecutionData) => (
          <Space size="small">
              <Tooltip title="编辑跟帖">
                  <Button
                      icon={<EditOutlined />}
                      onClick={() => handleEditReply(record)}
                  />
              </Tooltip>
              <Tooltip title="发布跟帖">
                  <Button
                      icon={<SendOutlined />}
                      onClick={() => handlePublishReply(record)}
                      loading={loadingPublish[record.id]}
                  />
              </Tooltip>
              <Tooltip title="删除">
                  <Popconfirm
                      title="你确定要删除这条记录吗？"
                      onConfirm={() => handleDelete(record.id)}
                      okText="确定"
                      cancelText="取消"
                  >
                      <Button icon={<DeleteOutlined />} danger />
                  </Popconfirm>
              </Tooltip>
          </Space>
        ),
    },
  ];

  return (
    <div className="task-execution-container">
      <Row gutter={16} style={{ marginBottom: 16 }} align="middle" justify="space-between">
        <Col span={24}>
          <Card className="task-info-card" bodyStyle={{ padding: '12px 24px' }}>
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
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMatchPrompt(e.target.value)}
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
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setGeneratePrompt(e.target.value)}
          placeholder="Enter generate prompt"
          autoSize={{ minRows: 4, maxRows: 8 }}
          disabled={isGenerating}
        />
      </Modal>
      
      <Modal
        title="编辑跟帖"
        visible={editReplyVisible}
        onCancel={handleCancelEditReply}
        width={800}
        footer={[
          <Button key="generate" type="primary" onClick={handleGenerateSingleReply} loading={loadingGenerateSingleReply}>
            生成跟帖
          </Button>,
          <Button key="save" type="primary" onClick={handleSaveReply}>
            保存
          </Button>,
          <Button key="cancel" onClick={handleCancelEditReply}>
            取消
          </Button>,
        ]}
      >
        <Row gutter={16}>
          <Col span={12}>
            <div style={{ marginBottom: '8px' }}>
              <Title level={5}>生成跟帖 prompt</Title>
            </div>
            <TextArea
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              placeholder="Enter generate prompt"
              style={{ height: '300px' }} // 固定高度
              disabled={loadingGenerateSingleReply}
            />
          </Col>
          <Col span={12}>
            <div style={{ marginBottom: '8px' }}>
              <Title level={5}>生成跟帖</Title>
            </div>
            <TextArea
              value={editReply}
              onChange={(e) => setEditReply(e.target.value)}
              placeholder="Generated reply"
              style={{ height: '300px' }} // 固定高度，与左侧保持一致
              disabled={loadingGenerateSingleReply}
            />
          </Col>
        </Row>
      </Modal>

      <Table<ExecutionData>
        columns={columns}
        dataSource={executionData}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1500 }}
      />
    </div>
  );
};

export default TaskExecution;