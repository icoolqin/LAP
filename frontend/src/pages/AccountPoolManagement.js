// AccountPoolManagement.js
import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Popconfirm, Tooltip, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SyncOutlined } from '@ant-design/icons';
import moment from 'moment';

const { Option } = Select;

const BASE_URL = 'http://localhost:3000'; // 根据您的后端地址调整

const AccountPoolManagement = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchAccounts();
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
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setCurrentAccount(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${BASE_URL}/accounts/${id}`, { method: 'DELETE' });
      message.success('Account deleted successfully');
      fetchAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
      message.error('Failed to delete account');
    }
  };

  const handleUpdateLoginState = async (id) => {
    // 更新playwright登录状态的逻辑将在未来实现
    message.info(`更新登录状态功能尚未实现，账号ID：${id}`);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (currentAccount) {
        // 更新账号
        await fetch(`${BASE_URL}/accounts/${currentAccount.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
        message.success('Account updated successfully');
      } else {
        // 新增账号
        await fetch(`${BASE_URL}/accounts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
        message.success('Account added successfully');
      }
      setModalVisible(false);
      fetchAccounts();
    } catch (error) {
      console.error('Error saving account:', error);
      message.error('Failed to save account');
    }
  };

  // 截断文本的函数
  const truncateText = (text, length = 15) => {
    if (!text) return '';
    return text.length > length ? `${text.slice(0, length)}...` : text;
  };

  const columns = [
    {
      title: '网站名称',
      dataIndex: 'website_name',
      key: 'website_name',
      render: (text) => (
        <Tooltip title={text}>
          {truncateText(text)}
        </Tooltip>
      ),
    },
    {
      title: '网站域名',
      dataIndex: 'website_domain',
      key: 'website_domain',
      render: (text) => (
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
      render: (text) => {
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
      render: (text) => (
        <span>{text || '无'}</span>
      ),
    },
    {
      title: '登录状态更新时间',
      dataIndex: 'login_state_update_time',
      key: 'login_state_update_time',
      render: (text) => text ? moment(parseInt(text)).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '距离上次更新时间',
      dataIndex: 'login_state_update_time',
      key: 'time_since_last_update',
      render: (text) => {
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
      render: (text) => text || '-',
    },
    {
      title: '最近一次使用时间',
      dataIndex: 'last_used_time',
      key: 'last_used_time',
      render: (text) => text ? moment(parseInt(text)).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '账号用户名',
      dataIndex: 'account_username',
      key: 'account_username',
      render: (text) => (
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
        <span>******</span> // 不在表格中显示明文密码
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
      render: (text) => text ? moment(parseInt(text)).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '最近一次登录网页截图',
      dataIndex: 'recent_login_screenshot',
      key: 'recent_login_screenshot',
      render: (text) => text ? (
        <a href={text} target="_blank" rel="noopener noreferrer">
          查看截图
        </a>
      ) : '-',
    },
    // 备注字段
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      render: (text) => (
        <Tooltip title={text}>
          {truncateText(text)}
        </Tooltip>
      ),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right', // 将操作列固定在最右侧
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="编辑账号">
            <Button
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="更新登录状态">
            <Button
              icon={<SyncOutlined />}
              onClick={() => handleUpdateLoginState(record.id)}
            />
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
        scroll={{ x: 1500 }} // 当表格列很多时，允许水平滚动
      />
      <Modal
        title={currentAccount ? '编辑账号' : '新增账号'}
        visible={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
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
    </div>
  );
};

export default AccountPoolManagement;
