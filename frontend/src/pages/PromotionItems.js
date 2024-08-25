import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Popconfirm, Badge, Card, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons';

const BASE_URL = 'http://localhost:3000';

function PromotionItems() {
    const [items, setItems] = useState([]);
    const [visible, setVisible] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchItems();
    }, []);

    useEffect(() => {
        if (visible && currentItem) {
            form.setFieldsValue(currentItem);
        } else {
            form.resetFields();
        }
    }, [visible, currentItem, form]);

    const fetchItems = () => {
        fetch(`${BASE_URL}/promotion-items`)
            .then(response => response.json())
            .then(data => setItems(data));
    };

    const handleAdd = () => {
        setVisible(true);
        setCurrentItem(null);
    };

    const handleEdit = (record) => {
        setCurrentItem(record);
        setVisible(true);
    };

    const handleSave = (values) => {
        const url = currentItem
            ? `${BASE_URL}/promotion-items/${currentItem.id}`
            : `${BASE_URL}/promotion-items`;
        const method = currentItem ? 'PUT' : 'POST';

        fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
        }).then(() => {
            fetchItems();
            setVisible(false);
        });
    };

    const handleDelete = (id) => {
        fetch(`${BASE_URL}/promotion-items/${id}`, { method: 'DELETE' })
            .then(() => {
                fetchItems();
            });
    };

    const handleToggleStatus = (id, status) => {
        fetch(`${BASE_URL}/promotion-items/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: status === '启用' ? '停用' : '启用' }),
        }).then(() => {
            fetchItems();
        });
    };

    const columns = [
        {
            title: '加入日期',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 100,
            render: (text) => new Date(text).toLocaleDateString(),
        },
        {
            title: '标的名称',
            dataIndex: 'name',
            key: 'name',
            width: 150,
            ellipsis: {
                showTitle: false,
            },
            render: (text) => (
                <Tooltip title={text}>
                    <span>{text}</span>
                </Tooltip>
            ),
        },
        {
            title: '标的说明',
            dataIndex: 'description',
            key: 'description',
            width: 200,
            ellipsis: {
                showTitle: false,
            },
            render: (text) => (
                <Tooltip title={text}>
                    <span>{text}</span>
                </Tooltip>
            ),
        },
        {
            title: '用户找标的方法',
            dataIndex: 'method',
            key: 'method',
            width: 200,
            ellipsis: {
                showTitle: false,
            },
            render: (text) => (
                <Tooltip title={text}>
                    <span>{text}</span>
                </Tooltip>
            ),
        },
        {
            title: '标的类型',
            dataIndex: 'type',
            key: 'type',
            width: 100,
        },
        {
            title: '补充信息',
            dataIndex: 'additional_info',
            key: 'additional_info',
            width: 200,
            ellipsis: {
                showTitle: false,
            },
            render: (text) => (
                <Tooltip title={text}>
                    <span>{text}</span>
                </Tooltip>
            ),
        },
        {
            title: '推广状态',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status) => (
                <Badge
                    status={status === '启用' ? 'success' : 'default'}
                    text={status}
                />
            ),
        },
        {
            title: '操作',
            key: 'action',
            fixed: 'right',
            width: 150,
            render: (_, record) => (
                <span>
                    <Tooltip title="修改">
                        <Button
                            type="link"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>
                    <Tooltip title={record.status === '启用' ? '停用' : '启用'}>
                        <Button
                            type="link"
                            icon={record.status === '启用' ? <StopOutlined /> : <CheckCircleOutlined />}
                            onClick={() => handleToggleStatus(record.id, record.status)}
                        />
                    </Tooltip>
                    <Popconfirm
                        title="确定要删除吗？"
                        onConfirm={() => handleDelete(record.id)}
                        okText="是"
                        cancelText="否"
                    >
                        <Tooltip title="删除">
                            <Button type="link" icon={<DeleteOutlined />} />
                        </Tooltip>
                    </Popconfirm>
                </span>
            ),
        },
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                    新增
                </Button>
            </div>
            <Table
                columns={columns}
                dataSource={items}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                scroll={{ x: 1300 }}
            />
            <Modal
                title={currentItem ? '修改推广标的' : '新增'}
                open={visible}
                onCancel={() => setVisible(false)}
                footer={null}
            >
                <Card bordered={false}>
                    <Form
                        form={form}
                        onFinish={handleSave}
                        labelCol={{ span: 6 }}
                        wrapperCol={{ span: 18 }}
                    >
                        <Form.Item name="name" label="标的名称" rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>
                        <Form.Item name="description" label="标的说明">
                            <Input.TextArea rows={3} />
                        </Form.Item>
                        <Form.Item name="method" label="用户找标方法">
                            <Input.TextArea rows={3} />
                        </Form.Item>
                        <Form.Item name="type" label="标的类型">
                            <Select>
                                <Select.Option value="微信小程序">微信小程序</Select.Option>
                                <Select.Option value="其他">其他</Select.Option>
                            </Select>
                        </Form.Item>
                        <Form.Item name="additional_info" label="补充信息">
                            <Input.TextArea rows={3} />
                        </Form.Item>
                        <Form.Item name="status" label="推广状态" initialValue="启用">
                            <Select>
                                <Select.Option value="启用">启用</Select.Option>
                                <Select.Option value="停用">停用</Select.Option>
                            </Select>
                        </Form.Item>
                        <Form.Item wrapperCol={{ offset: 6 }}>
                            <Button type="primary" htmlType="submit">
                                保存
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            </Modal>
        </div>
    );
}

export default PromotionItems;