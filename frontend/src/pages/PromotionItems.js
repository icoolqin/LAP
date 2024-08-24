import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Popconfirm, Badge, Card } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const BASE_URL = 'http://localhost:3000';

function PromotionItems() {
    const [items, setItems] = useState([]);
    const [visible, setVisible] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);

    useEffect(() => {
        fetch(`${BASE_URL}/promotion-items`)
            .then(response => response.json())
            .then(data => setItems(data));
    }, []);

    const handleAdd = () => {
        setVisible(true);
        setCurrentItem(null);
    };

    const handleSave = (values) => {
        if (currentItem) {
            fetch(`${BASE_URL}/promotion-items/${currentItem.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            }).then(() => {
                fetch(`${BASE_URL}/promotion-items`)
                    .then(response => response.json())
                    .then(data => setItems(data));
                setVisible(false);
            });
        } else {
            fetch(`${BASE_URL}/promotion-items`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            }).then(() => {
                fetch(`${BASE_URL}/promotion-items`)
                    .then(response => response.json())
                    .then(data => setItems(data));
                setVisible(false);
            });
        }
    };

    const handleDelete = (id) => {
        fetch(`${BASE_URL}/promotion-items/${id}`, {
            method: 'DELETE',
        }).then(() => {
            fetch(`${BASE_URL}/promotion-items`)
                .then(response => response.json())
                .then(data => setItems(data));
        });
    };

    const handleToggleStatus = (id, status) => {
        fetch(`${BASE_URL}/promotion-items/${id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: status === '启用' ? '停用' : '启用' }),
        }).then(() => {
            fetch(`${BASE_URL}/promotion-items`)
                .then(response => response.json())
                .then(data => setItems(data));
        });
    };

    return (
        <div>
            <div style={{ textAlign: 'right', marginBottom: 16 }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                    新增
                </Button>
            </div>
            <Table dataSource={items} rowKey="id">
                <Table.Column title="加入日期" dataIndex="created_at" render={(text) => new Date(text).toLocaleDateString()} />
                <Table.Column title="标的名称" dataIndex="name" />
                <Table.Column title="标的说明" dataIndex="description" />
                <Table.Column title="用户找标方法" dataIndex="method" />
                <Table.Column title="标的类型" dataIndex="type" />
                <Table.Column title="补充信息" dataIndex="additional_info" />
                <Table.Column
                    title="推广状态"
                    dataIndex="status"
                    render={(status) => (
                        <Badge
                            status={status === '启用' ? 'success' : 'default'}
                            text={status}
                        />
                    )}
                />
                <Table.Column
                    title="操作"
                    render={(text, record) => (
                        <span>
                            <Button type="link" onClick={() => { setVisible(true); setCurrentItem(record); }}>修改</Button>
                            <Button type="link" onClick={() => handleToggleStatus(record.id, record.status)}>
                                {record.status === '启用' ? '停用' : '启用'}
                            </Button>
                            <Popconfirm
                                title="确定要删除吗？"
                                onConfirm={() => handleDelete(record.id)}
                                okText="是"
                                cancelText="否"
                            >
                                <Button type="link">删除</Button>
                            </Popconfirm>
                        </span>
                    )}
                />
            </Table>
            <Modal
                title={currentItem ? '修改推广标的' : '新增推广标的'}
                open={visible}
                onCancel={() => setVisible(false)}
                footer={null}
            >
                <Card bordered={false}>
                    <Form
                        initialValues={currentItem}
                        onFinish={handleSave}
                        labelCol={{ span: 6 }}
                        wrapperCol={{ span: 18 }}
                    >
                        <Form.Item name="name" label="标的名称" rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>
                        <Form.Item name="description" label="标的说明">
                            <Input />
                        </Form.Item>
                        <Form.Item name="method" label="用户找标方法">
                            <Input />
                        </Form.Item>
                        <Form.Item name="type" label="标的类型">
                            <Select>
                                <Select.Option value="类型1">类型1</Select.Option>
                                <Select.Option value="类型2">类型2</Select.Option>
                            </Select>
                        </Form.Item>
                        <Form.Item name="additional_info" label="补充信息">
                            <Input />
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
