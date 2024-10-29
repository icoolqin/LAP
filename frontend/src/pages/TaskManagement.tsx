//TaskManagement.tsx
import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Popconfirm, Badge, Tooltip, Drawer, Steps, message, Row, Col, DatePicker } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined } from '@ant-design/icons';
import moment from 'moment';
import { Link } from 'react-router-dom';

const { Step } = Steps;

const BASE_URL = 'http://localhost:3000';

interface Task {
    id: string;
    name: string;
    created_at: string;
    promotion_count: number;
    post_count: number;
    match_count: number;
    stage: string;
}

interface PromotionItem {
    id: string;
    name: string;
    type: string;
    created_at: string;
}

interface HotPost {
    id: string;
    time: number;
    title: string;
    domain: string;
}

interface Filters {
    dateRange?: [moment.Moment, moment.Moment];
    name?: string;
    type?: string;
}

interface HotPostFilters {
    dateRange?: [moment.Moment, moment.Moment];
    title?: string;
    domain?: string;
}

interface HotPostPagination {
    current: number;
    pageSize: number;
    total: number;
}

function TaskManagement() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [drawerVisible, setDrawerVisible] = useState<boolean>(false);
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [currentTask, setCurrentTask] = useState<Task | null>(null);
    const [form] = Form.useForm();
    const [taskName, setTaskName] = useState<string>('');

    const [promotionItems, setPromotionItems] = useState<PromotionItem[]>([]);
    const [selectedItems, setSelectedItems] = useState<PromotionItem[]>([]);
    const [filters, setFilters] = useState<Filters>({});
    const [isEditing, setIsEditing] = useState<boolean>(false);

    const [selectedHotPosts, setSelectedHotPosts] = useState<HotPost[]>([]);
    const [hotPostFilters, setHotPostFilters] = useState<HotPostFilters>({});
    const [hotPosts, setHotPosts] = useState<HotPost[]>([]);
    const [hotPostsPagination, setHotPostsPagination] = useState<HotPostPagination>({
        current: 1,
        pageSize: 100,
        total: 0,
    });

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
            startTime: filters.dateRange ? filters.dateRange[0].valueOf() : undefined,
            endTime: filters.dateRange ? filters.dateRange[1].valueOf() : undefined,
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

    const handleDeleteSelectedItem = (id: string) => {
        setSelectedItems(selectedItems.filter(item => item.id !== id));
    };

    const handleClearSelectedHotPosts = () => {
        setSelectedHotPosts([]);
        setHotPosts([]);
    };

    const handleDrawerOpen = () => {
        setDrawerVisible(true);
        setCurrentStep(0);
        form.resetFields();
        setSelectedItems([]);
        setSelectedHotPosts([]);
        setHotPosts([]);
    };

    const handleDrawerClose = () => {
        setDrawerVisible(false);
        setIsEditing(false);
        setCurrentTask(null);
        form.resetFields();
        setSelectedItems([]);
        setSelectedHotPosts([]);
        setHotPosts([]);
    };

    const handleNext = () => {
        if (currentStep === 0) {
            form.validateFields().then(() => {
                setTaskName(form.getFieldValue('name'));
                setCurrentStep(currentStep + 1);
            }).catch((error) => {
                console.error('Validation failed:', error);
            });
        } else {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevious = () => {
        setCurrentStep(currentStep - 1);
    };

    const handleFinish = () => {
        const validHotPosts = selectedHotPosts.filter(post => post.id);

        if (validHotPosts.length !== selectedHotPosts.length) {
            message.error('有些选中的帖子缺少 ID，无法保存。');
            return;
        }
        const taskData = {
            name: form.getFieldValue('name'),
            stage: isEditing && currentTask ? currentTask.stage : '初创',
        };

        const payload = {
            taskData,
            promotionItems: selectedItems,
            hotPosts: validHotPosts,
        };

        const url = isEditing && currentTask ? `${BASE_URL}/tasks/${currentTask.id}` : `${BASE_URL}/tasks/create`;
        const method = isEditing ? 'PUT' : 'POST';

        fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    message.success(isEditing ? '任务更新成功' : '任务创建成功');
                    fetchTasks();
                    handleDrawerClose();
                } else {
                    message.error(isEditing ? '任务更新失败' : '任务创建失败');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                message.error(isEditing ? '任务更新失败' : '任务创建失败');
            });
    };

    const handleEdit = (record: Task) => {
        setCurrentTask(record);
        setDrawerVisible(true);
        setIsEditing(true);
        setCurrentStep(0);
        form.setFieldsValue({
            name: record.name,
        });
        setSelectedItems([]);
        setSelectedHotPosts([]);
        setHotPosts([]);
        // Fetch and set selected promotion items
        fetch(`${BASE_URL}/tasks/${record.id}/promotion-items`)
            .then(response => response.json())
            .then(data => setSelectedItems(data))
            .catch(error => console.error('Error fetching promotion items:', error));

        // Fetch and set selected hot posts
        fetch(`${BASE_URL}/tasks/${record.id}/hot-posts`)
            .then(response => response.json())
            .then(data => {
                setSelectedHotPosts(data);
                setHotPosts(data);
            })
            .catch(error => console.error('Error fetching hot posts:', error));
    };

    const handleDelete = (id: string) => {
        fetch(`${BASE_URL}/tasks/${id}`, { method: 'DELETE' })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    message.success('任务已删除');
                    fetchTasks();
                } else {
                    throw new Error('Delete operation was not successful');
                }
            })
            .catch(error => {
                message.error('删除任务失败');
                console.error('Error deleting task:', error);
            });
    };

    const fetchHotPosts = (page = 1, pageSize = 100) => {
        const params = {
            startTime: hotPostFilters.dateRange ? Math.floor(hotPostFilters.dateRange[0].valueOf() / 1000) : undefined,
            endTime: hotPostFilters.dateRange ? Math.floor(hotPostFilters.dateRange[1].valueOf() / 1000) : undefined,
            title: hotPostFilters.title || '',
            domain: hotPostFilters.domain || '',
            page,
            pageSize,
        };

        fetch(`${BASE_URL}/hot-posts/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params),
        })
            .then(response => response.json())
            .then(data => {
                if (data.items && Array.isArray(data.items)) {
                  setHotPosts(data.items);
                  setHotPostsPagination({
                    current: page,
                    pageSize: pageSize,
                    total: data.total,
                  });
                  setSelectedHotPosts(prevSelected => {
                    const newItems = data.items.filter((item: HotPost) => !prevSelected.some(prevItem => prevItem.id === item.id));
                    return [...prevSelected, ...newItems];
                  });
                } else {
                  console.error('Received invalid data:', data);
                  message.error('Failed to fetch hot posts. Please try again.');
                }
            })              
            .catch(error => {
                console.error('Failed to fetch hot posts:', error);
                message.error('Failed to fetch hot posts. Please try again.');
            });
    };

    const handleQueryAndAddHotPosts = () => {
        fetchHotPosts(1, hotPostsPagination.pageSize);
    };

    const handleHotPostTableChange = (pagination: any) => {
        fetchHotPosts(pagination.current, pagination.pageSize);
    };

    const handleDeleteSelectedHotPost = (id: string) => {
        setSelectedHotPosts(prevSelected => prevSelected.filter(item => item.id !== id));
        setHotPosts(prevHotPosts => prevHotPosts.filter(item => item.id !== id));
    };

    const hotPostColumns = [
        {
            title: 'Date',
            dataIndex: 'time',
            key: 'time',
            render: (text: number) => {
                const date = moment(text * 1000);
                return date.isValid() ? date.format('YYYY-MM-DD HH:mm:ss') : 'Invalid date';
            },
        },
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
        },
        {
            title: 'Domain',
            dataIndex: 'domain',
            key: 'domain',
        },
        {
            title: '操作',
            key: 'action',
            render: (_: any, record: HotPost) => (
                <Button type="link" onClick={() => handleDeleteSelectedHotPost(record.id)}>
                    删除
                </Button>
            ),
        },
    ];

    const hotPostFilterForm = (
        <Form layout="inline" style={{ marginBottom: 16 }}>
            <Form.Item label="日期">
                <DatePicker.RangePicker
                    showTime={{ format: 'HH:mm:ss' }}
                    format="YYYY-MM-DD HH:mm:ss"
                    onChange={(dates) => setHotPostFilters({ ...hotPostFilters, dateRange: dates as [moment.Moment, moment.Moment] })}
                />
            </Form.Item>
            <Form.Item label="标题">
                <Input
                    placeholder="请输入标题"
                    onChange={(e) => setHotPostFilters({ ...hotPostFilters, title: e.target.value })}
                />
            </Form.Item>
            <Form.Item label="域名">
                <Input
                    placeholder="请输入域名"
                    onChange={(e) => setHotPostFilters({ ...hotPostFilters, domain: e.target.value })}
                />
            </Form.Item>
        </Form>
    );

    const columns = [
        {
            title: '创建时间',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 180,
            render: (text: string) => {
                const timestamp = parseInt(text.toString().slice(0, 13), 10);
                const date = new Date(timestamp);
                return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
            },
        },
        {
            title: '任务名称',
            dataIndex: 'name',
            key: 'name',
            width: 200,
            ellipsis: {
                showTitle: false,
            },
            render: (text: string) => (
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
            render: (stage: string) => {
                const stageMap: { [key: string]: string } = {
                    '初创': 'processing',
                    '匹配': 'processing',
                    '生成': 'processing',
                    '发布': 'processing',
                    '完成': 'success',
                };
                return (
                    <Badge status={stageMap[stage] as any} text={stage} />
                );
            },
        },
        {
            title: '操作',
            key: 'action',
            fixed: 'right' as const,
            width: 120,
            render: (_: any, record: Task) => (
                <span>
                    <Tooltip title="编辑">
                        <Button
                            type="link"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>
                    <Tooltip title="执行">
                        <a 
                            href={`/conquer-world/task-execution/${record.id}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                        >
                            <Button
                            type="link"
                            icon={<PlayCircleOutlined />}
                            />
                        </a>
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
                    onChange={(dates) => setFilters({ ...filters, dateRange: dates as [moment.Moment, moment.Moment] })}
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
            render: (text: string) => moment(text).format('YYYY-MM-DD HH:mm:ss'),
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
            render: (_: any, record: PromotionItem) => (
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
                <Input onChange={(e) => setTaskName(e.target.value)} />
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
                <>
                    {hotPostFilterForm}
                    <Row style={{ marginBottom: 16 }}>
                        <Col>
                            <Button type="primary" onClick={handleQueryAndAddHotPosts}>查询并添加</Button>
                        </Col>
                        <Col>
                            <Button style={{ marginLeft: 8 }} onClick={handleClearSelectedHotPosts}>清空所选</Button>
                        </Col>
                    </Row>
                    <Table
                        columns={hotPostColumns}
                        dataSource={hotPosts}
                        rowKey="id"
                        pagination={hotPostsPagination}
                        onChange={handleHotPostTableChange}
                    />
                </>
            ),
        }
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
                dataSource={tasks}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                scroll={{ x: 1300 }}
            />
            <Drawer
                title={isEditing ? "编辑任务" : "新增任务"}
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
                            <Button type="primary" onClick={handleFinish}>
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