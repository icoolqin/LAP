import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select } from 'antd';

function PromotionItems() {
    const [items, setItems] = useState([]);
    const [visible, setVisible] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);

    useEffect(() => {
        fetch('/promotion-items')
            .then(response => response.json())
            .then(data => setItems(data));
    }, []);

    const handleAdd = () => {
        setVisible(true);
        setCurrentItem(null);
    };

    const handleSave = (values) => {
        if (currentItem) {
            fetch(`/promotion-items/${currentItem.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            }).then(() => {
                fetch('/promotion-items')
                    .then(response => response.json())
                    .then(data => setItems(data));
                setVisible(false);
            });
        } else {
            fetch('/promotion-items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            }).then(() => {
                fetch('/promotion-items')
                    .then(response => response.json())
                    .then(data => setItems(data));
                setVisible(false);
            });
        }
    };

    const handleDelete = (id) => {
        fetch(`/promotion-items/${id}`, {
            method: 'DELETE',
        }).then(() => {
            fetch('/promotion-items')
                .then(response => response.json())
                .then(data => setItems(data));
        });
    };

    const handleToggleStatus = (id, status) => {
        fetch(`/promotion-items/${id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: status === '启用' ? '停用' : '启用' }),
        }).then(() => {
            fetch('/promotion-items')
                .then(response => response.json())
                .then(data => setItems(data));
        });
    };

    return (
        <div>
            <Button type="primary" onClick={handleAdd}>新增推广标的</Button>
            <Table dataSource={items} rowKey="id">
                <Table.Column title="加入日期" dataIndex="created_at" render={(text) => new Date(text).toLocaleDateString()} />
                <Table.Column title="标的名称" dataIndex="name" />
                <Table.Column title="标的说明" dataIndex="description" />
                <Table.Column title="用户找标方法" dataIndex="method" />
                <Table.Column title="标的类型" dataIndex="type" />
                <Table.Column title="补充信息" dataIndex="additional_info" />
                <Table.Column title="推广状态" dataIndex="status" />
                <Table.Column
                    title="操作"
                    render={(text, record) => (
                        <span>
                            <Button onClick={() => { setVisible(true); setCurrentItem(record); }}>修改</Button>
                            <Button onClick={() => handleToggleStatus(record.id, record.status)}>
                                {record.status === '启用' ? '停用' : '启用'}
                            </Button>
                            <Button onClick={() => handleDelete(record.id)}>删除</Button>
                        </span>
                    )}
                />
            </Table>
            <Modal
                title={currentItem ? '修改推广标的' : '新增推广标的'}
                visible={visible}
                onCancel={() => setVisible(false)}
                onOk={() => {
                    document.getElementById('promotion-form').submit();
                }}
            >
                <Form
                    id="promotion-form"
                    initialValues={currentItem}
                    onFinish={handleSave}
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
                            <Select.Option value="类型1">微信小程序</Select.Option>
                            <Select.Option value="类型2">其他</Select.Option>
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
                </Form>
            </Modal>
        </div>
    );
}

export default PromotionItems;
