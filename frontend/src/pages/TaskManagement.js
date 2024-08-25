import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Popconfirm, Badge, Tooltip, Drawer, Steps, message, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { DatePicker } from 'antd';
import moment from 'moment';

const { Step } = Steps;

const BASE_URL = 'http://localhost:3000';

function TaskManagement() {
    const [tasks, setTasks] = useState([]);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [currentTask, setCurrentTask] = useState(null);
    const [form] = Form.useForm();

    const [promotionItems, setPromotionItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [filters, setFilters] = useState({});

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = () => {
        fetch(`${BASE_URL}/tasks`)
            .then(response => response.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setTasks(data);
                } else {
                    console.error('Received non-array data:', data);
                    setTasks([]);
                }
            })
            .catch(error => console.error('Error fetching tasks:', error));
    };

    const fetchPromotionItems = () => {
        const params = {
            startTime: filters.dateRange ? filters.dateRange[0].format('YYYY-MM-DD HH:mm:ss') : undefined,
            endTime: filters.dateRange ? filters.dateRange[1].format('YYYY-MM-DD HH:mm:ss') : undefined,
            name: filters.name || '',
            type: filters.type || '',
        };
    
        fetch(`${BASE_URL}/promotion-items/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params),
        })
            .then(response => response.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setSelectedItems(prevItems => {
                        const newItems = data.filter(item => !prevItems.some(prevItem => prevItem.id === item.id));
                        return [...prevItems, ...newItems];
                    });
                } else {
                    console.error('Received non-array data:', data);
                    message.error('Failed to fetch promotion items. Please try again.');
                }
            })
            .catch(error => {
                console.error('Failed to fetch promotion items:', error);
                message.error('Failed to fetch promotion items. Please try again.');
            });
    };
    

    const handleQueryAndAdd = () => {
        fetchPromotionItems();
    };

    const handleClearSelected = () => {
        setSelectedItems([]);
    };

    const handleDeleteSelectedItem = (id) => {
        setSelectedItems(selectedItems.filter(item => item.id !== id));
    };

    const handleDrawerOpen = () => {
        setDrawerVisible(true);
        setCurrentStep(0);
        form.resetFields();
    };

    const handleDrawerClose = () => {
        setDrawerVisible(false);
    };

    const handleNext = () => {
        setCurrentStep(currentStep + 1);
    };

    const handlePrevious = () => {
        setCurrentStep(currentStep - 1);
    };

    const handleFinish = (values) => {
        const taskData = {
            ...values,
            stage: '匹配',
            promotion_count: selectedItems.length,
            post_count: 0,
            match_count: 0,
        };

        fetch(`${BASE_URL}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData),
        }).then(response => response.json())
            .then(data => {
                if (data.id) {
                    message.success('任务创建成功');
                    fetchTasks();
                    setDrawerVisible(false);
                } else {
                    message.error('任务创建失败');
                }
            });
    };

    const handleEdit = (record) => {
        setCurrentTask(record);
        setDrawerVisible(true);
        setCurrentStep(0);
    };

    const handleDelete = (id) => {
        fetch(`${BASE_URL}/tasks/${id}`, { method: 'DELETE' })
            .then(() => {
                message.success('任务已删除');
                fetchTasks();
            })
            .catch(error => {
                message.error('删除任务失败');
                console.error('Error deleting task:', error);
            });
    };

    const columns = [
        {
            title: '创建时间',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 150,
            render: (text) => new Date(text).toLocaleString(),
        },
        {
            title: '任务名称',
            dataIndex: 'name',
            key: 'name',
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
            title: '推广标的数',
            dataIndex: 'promotion_count',
            key: 'promotion_count',
            width: 150,
        },
        {
            title: '网罗帖子数',
            dataIndex: 'post_count',
            key: 'post_count',
            width: 150,
        },
        {
            title: '匹配条目数',
            dataIndex: 'match_count',
            key: 'match_count',
            width: 150,
        },
        {
            title: '任务阶段',
            dataIndex: 'stage',
            key: 'stage',
            width: 150,
            render: (stage) => {
                const stageMap = {
                    '匹配': 'processing',
                    '生成': 'processing',
                    '发布': 'processing',
                    '完成': 'success',
                };
                return (
                    <Badge status={stageMap[stage]} text={stage} />
                );
            },
        },
        {
            title: '操作',
            key: 'action',
            fixed: 'right',
            width: 200,
            render: (_, record) => (
                <span>
                    <Tooltip title="编辑">
                        <Button
                            type="link"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>
                    <Tooltip title="执行">
                        <Button
                            type="link"
                            icon={<EditOutlined />}
                            onClick={() => {/* 打开抽屉的功能，后面实现 */}}
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

    const filterForm = (
        <Form layout="inline" style={{ marginBottom: 16 }}>
            <Form.Item label="加入时间">
                <DatePicker.RangePicker
                    showTime={{ format: 'HH:mm:ss' }}
                    format="YYYY-MM-DD HH:mm:ss"
                    onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
                />
            </Form.Item>
            <Form.Item label="标的名称">
                <Input
                    placeholder="请输入标的名称"
                    onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                />
            </Form.Item>
            <Form.Item label="标的类型">
                <Input
                    placeholder="请输入标的类型"
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                />
            </Form.Item>
        </Form>
    );

    const promotionColumns = [
        {
            title: '加入时间',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (text) => moment(text).format('YYYY-MM-DD HH:mm:ss'),
        },
        {
            title: '标的名称',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: '标的类型',
            dataIndex: 'type',
            key: 'type',
        },
        {
            title: '操作',
            key: 'action',
            render: (_, record) => (
                <Button type="link" onClick={() => handleDeleteSelectedItem(record.id)}>
                    删除
                </Button>
            ),
        },
    ];

    const steps = [
        {
            title: '填写任务名称',
            content: (
                <Form.Item
                    name="name"
                    label="任务名称"
                    rules={[{ required: true, message: '请输入任务名称' }]}
                >
                    <Input />
                </Form.Item>
            ),
        },
        {
            title: '选择推广标的',
            content: (
                <>
                    {filterForm}
                    <Row style={{ marginBottom: 16 }}>
                        <Col>
                            <Button type="primary" onClick={handleQueryAndAdd}>查询并添加</Button>
                        </Col>
                        <Col>
                            <Button style={{ marginLeft: 8 }} onClick={handleClearSelected}>清空所选</Button>
                        </Col>
                    </Row>
                    <Table
                        columns={promotionColumns}
                        dataSource={selectedItems}
                        rowKey="id"
                        pagination={false}
                    />
                </>
            ),
        },
        {
            title: '选择网罗帖子',
            content: (
                <div>
                    {/* 这里放置选择网罗帖子的组件 */}
                </div>
            ),
        },
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleDrawerOpen}>
                    新增任务
                </Button>
            </div>
            <Table
                columns={columns}
                dataSource={tasks || []}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                scroll={{ x: 1300 }}
            />
            <Drawer
                title="新增任务"
                width="80%"
                onClose={handleDrawerClose}
                visible={drawerVisible}
                bodyStyle={{ paddingBottom: 80 }}
            >
                <Steps current={currentStep}>
                    {steps.map((step, index) => (
                        <Step key={index} title={step.title} />
                    ))}
                </Steps>
                <Form
                    form={form}
                    layout="vertical"
                    hideRequiredMark
                    initialValues={{}}
                    onFinish={handleFinish}
                    style={{ marginTop: 24 }}
                >
                    {steps[currentStep].content}
                    <div style={{ marginTop: 24 }}>
                        {currentStep > 0 && (
                            <Button style={{ margin: '0 8px' }} onClick={handlePrevious}>
                                上一步
                            </Button>
                        )}
                        {currentStep < steps.length - 1 && (
                            <Button type="primary" onClick={handleNext}>
                                下一步
                            </Button>
                        )}
                        {currentStep === steps.length - 1 && (
                            <Button type="primary" htmlType="submit">
                                完成
                            </Button>
                        )}
                    </div>
                </Form>
            </Drawer>
        </div>
    );
}

export default TaskManagement;
