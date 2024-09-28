// AccountPoolManagement.tsx
import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Popconfirm, Tooltip, Space, Spin } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SyncOutlined } from '@ant-design/icons';
import moment from 'moment';

const BASE_URL = 'http://localhost:3000';

interface Account {
  id: string;
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

const AccountPoolManagement: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [addEditModalVisible, setAddEditModalVisible] = useState<boolean>(false);
  const [qrCodeModalVisible, setQrCodeModalVisible] = useState<boolean>(false);
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
  const [form] = Form.useForm();
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [qrCodeLoading, setQrCodeLoading] = useState<boolean>(false);
  const [pollingIntervalId, setPollingIntervalId] = useState<number | null>(null);

  useEffect(() => {
    fetchAccounts();
    return () => {
      if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
      }
    };
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/accounts`);
      const data = await response.json();
      setAccounts(data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      message.error('Failed to fetch accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setCurrentAccount(null);
    form.resetFields();
    setAddEditModalVisible(true);
  };

  const handleEdit = (record: Account) => {
    setCurrentAccount(record);
    form.setFieldsValue(record);
    setAddEditModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${BASE_URL}/accounts/${id}`, { method: 'DELETE' });
      message.success('Account deleted successfully');
      fetchAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
      message.error('Failed to delete account');
    }
  };

  const handleUpdateLoginState = async (id: string) => {
    setQrCodeModalVisible(true);
    setQrCodeUrl(null);
    setQrCodeLoading(true);
    message.info(`正在获取网站登录二维码，账号ID：${id}`);
    
    try {
      const response = await fetch(`${BASE_URL}/accounts/${id}/update-login-state`, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setQrCodeUrl(`data:image/png;base64,${data.qrCodeData}`);
        setQrCodeLoading(false);
        message.success('二维码已获取，请扫码登录');

        // Start polling to check login status
        const intervalId = window.setInterval(async () => {
          const statusResponse = await fetch(`${BASE_URL}/accounts/${id}/login-status`);
          const statusData = await statusResponse.json();
          if (statusData.success && statusData.status === 'success') {
            message.success('登录成功');
            setQrCodeModalVisible(false);
            clearInterval(intervalId);
            setPollingIntervalId(null);
            // Update the accounts list
            fetchAccounts();
          } else if (statusData.success && statusData.status === 'failed') {
            message.error('登录失败');
            setQrCodeModalVisible(false);
            clearInterval(intervalId);
            setPollingIntervalId(null);
          }
        }, 3000); // Poll every 3 seconds
        setPollingIntervalId(intervalId);
      } else {
        message.error('获取二维码失败');
        setQrCodeLoading(false);
      }
    } catch (error) {
      console.error('Error updating login state:', error);
      message.error('获取二维码失败');
      setQrCodeLoading(false);
    }
  };

  const handleAddEditModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (currentAccount) {
        await fetch(`${BASE_URL}/accounts/${currentAccount.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
        message.success('Account updated successfully');
      } else {
        await fetch(`${BASE_URL}/accounts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
        message.success('Account added successfully');
      }
      setAddEditModalVisible(false);
      fetchAccounts();
    } catch (error) {
      console.error('Error saving account:', error);
      message.error('Failed to save account');
    }
  };

  const truncateText = (text: string | undefined, length: number = 15): string => {
    if (!text) return '';
    return text.length > length ? `${text.slice(0, length)}...` : text;
  };

  const columns = [
    {
      title: '网站名称',
      dataIndex: 'website_name',
      key: 'website_name',
      render: (text: string) => (
        <Tooltip title={text}>
          {truncateText(text)}
        </Tooltip>
      ),
    },
    {
      title: '网站域名',
      dataIndex: 'website_domain',
      key: 'website_domain',
      render: (text: string) => (
        <Tooltip title={text}>
          <a href={text} target="_blank" rel="noopener noreferrer">
            {truncateText(text)}
          </a>
        </Tooltip>
      ),
    },
    {
      title: '账号状态',
      dataIndex: 'account_status',
      key: 'account_status',
      render: (text: string) => {
        let color = 'green';
        if (text === '暂停') color = 'orange';
        if (text === '失效') color = 'red';
        return <span style={{ color }}>{text || '正常'}</span>;
      },
    },
    {
      title: 'Playwright登录状态保存',
      dataIndex: 'playwright_login_state',
      key: 'playwright_login_state',
      render: (text: string) => (
        <span>{text ? '已保存' : '无'}</span>
      ),
    },
    {
      title: '登录状态更新时间',
      dataIndex: 'login_state_update_time',
      key: 'login_state_update_time',
      render: (text: string) => text ? moment(parseInt(text)).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '距离上次更新时间',
      dataIndex: 'login_state_update_time',
      key: 'time_since_last_update',
      render: (text: string) => {
        if (text) {
          const duration = moment.duration(moment().diff(moment(parseInt(text))));
          return `${duration.asHours().toFixed(1)} 小时`;
        }
        return '-';
      },
    },
    {
      title: '登录状态建议更新周期',
      dataIndex: 'login_state_suggested_update_interval',
      key: 'login_state_suggested_update_interval',
      render: (text: string) => text || '-',
    },
    {
      title: '最近一次使用时间',
      dataIndex: 'last_used_time',
      key: 'last_used_time',
      render: (text: string) => text ? moment(parseInt(text)).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '账号用户名',
      dataIndex: 'account_username',
      key: 'account_username',
      render: (text: string) => (
        <Tooltip title={text}>
          {truncateText(text)}
        </Tooltip>
      ),
    },
    {
      title: '账号密码',
      dataIndex: 'account_password',
      key: 'account_password',
      render: () => (
        <span>******</span>
      ),
    },
    {
      title: '账号绑定手机号',
      dataIndex: 'account_bound_phone_number',
      key: 'account_bound_phone_number',
    },
    {
      title: '账号最近更新时间',
      dataIndex: 'account_last_update_time',
      key: 'account_last_update_time',
      render: (text: string) => text ? moment(parseInt(text)).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '最近一次登录网页截图',
      dataIndex: 'recent_login_screenshot',
      key: 'recent_login_screenshot',
      render: (text: string) => text ? (
        <a href={text} target="_blank" rel="noopener noreferrer">
          查看截图
        </a>
      ) : '-',
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      render: (text: string) => (
        <Tooltip title={text}>
          {truncateText(text)}
        </Tooltip>
      ),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 150,
      render: (_: any, record: Account) => (
        <Space size="small">
          <Tooltip title="编辑账号">
            <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Tooltip title="更新登录状态">
            <Button icon={<SyncOutlined />} onClick={() => handleUpdateLoginState(record.id)} />
          </Tooltip>
          <Popconfirm
            title="确认删除此账号吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="是"
            cancelText="否"
          >
            <Tooltip title="删除">
              <Button icon={<DeleteOutlined />} danger />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ marginBottom: 16 }}>
        新增账号
      </Button>
      <Table
        columns={columns}
        dataSource={accounts}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1500 }}
      />
      <Modal
        title={currentAccount ? '编辑账号' : '新增账号'}
        visible={addEditModalVisible}
        onOk={handleAddEditModalOk}
        onCancel={() => setAddEditModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="website_name"
            label="网站名称"
            rules={[{ required: true, message: '请输入网站名称' }]}
          >
            <Input placeholder="请输入网站名称" />
          </Form.Item>
          <Form.Item
            name="website_domain"
            label="网站域名"
            rules={[{ required: true, message: '请输入网站域名' }]}
          >
            <Input placeholder="请输入网站域名" />
          </Form.Item>
          <Form.Item
            name="account_username"
            label="账号用户名"
            rules={[{ required: true, message: '请输入账号用户名' }]}
          >
            <Input placeholder="请输入账号用户名" />
          </Form.Item>
          <Form.Item
            name="account_password"
            label="账号密码"
            rules={[{ required: true, message: '请输入账号密码' }]}
          >
            <Input.Password placeholder="请输入账号密码" />
          </Form.Item>
          <Form.Item
            name="account_bound_phone_number"
            label="账号绑定手机号"
          >
            <Input placeholder="请输入账号绑定手机号" />
          </Form.Item>
          <Form.Item
            name="remarks"
            label="备注"
          >
            <Input.TextArea placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="二维码登录"
        visible={qrCodeModalVisible}
        onOk={() => setQrCodeModalVisible(false)}
        onCancel={() => setQrCodeModalVisible(false)}
        footer={null}
      >
        {qrCodeLoading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin tip="正在获取二维码，请稍候..." />
          </div>
        ) : qrCodeUrl ? (
          <img src={qrCodeUrl} alt="QR Code" style={{ width: '100%' }} />
        ) : (
          <p>无法获取二维码，请重试。</p>
        )}
      </Modal>
    </div>
  );
};

export default AccountPoolManagement;