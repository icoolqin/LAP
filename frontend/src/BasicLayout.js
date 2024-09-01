import React from 'react';
import ProLayout, { PageContainer } from '@ant-design/pro-layout';
import { BrowserRouter as Router, Route, Routes, Link, useLocation, useParams } from 'react-router-dom';
import { SmileOutlined } from '@ant-design/icons';
import Dashboard from './pages/Dashboard';
import HotPosts from './pages/HotPosts';
import PromotionItems from './pages/PromotionItems'; 
import TaskManagement from './pages/TaskManagement'; 
import TaskExecution from './pages/TaskExecution'; 

const BasicLayout = () => {
  const location = useLocation();
  const params = useParams();

  const menuData = [
    {
      path: '/dashboard',
      name: 'Dashboard',
      icon: <SmileOutlined />,
    },
    {
      path: '/net-world',
      name: '网罗天下',
      icon: <SmileOutlined />,
      routes: [
        {
          path: '/net-world/hot-posts',
          name: '热门帖子',
          component: HotPosts,
        },
      ],
    },
    {
      path: '/announcement',
      name: '昭告全网',
      icon: <SmileOutlined />,
      routes: [
        {
          path: '/announcement/promotion-items',
          name: '自建推广标的',
          component: PromotionItems,
        },
      ],
    },
    {
      path: '/conquer-world',
      name: '驰骋江山', 
      icon: <SmileOutlined />,
      routes: [
        {
          path: '/conquer-world/task-management',
          name: '推广任务管理',
          component: TaskManagement,
        },
        {
          path: '/conquer-world/task-execution/:id',
          name: '执行任务',
          component: TaskExecution,
          hideInMenu: true, 
        },
      ],
    },
  ];

  const routeMap = {
    '/': '首页',
    '/dashboard': 'Dashboard',
    '/net-world': '网罗天下',
    '/net-world/hot-posts': '热门帖子',
    '/announcement': '昭告全网',
    '/announcement/promotion-items': '自建推广标的',
    '/conquer-world': '驰骋江山',
    '/conquer-world/task-management': '推广任务管理',
    '/conquer-world/task-execution': '执行任务', 
  };

  const getPageTitle = (pathname) => {
    if (pathname.startsWith('/conquer-world/task-execution/')) {
      return '执行任务';
    }
    return routeMap[pathname] || pathname;
  };

  const getBreadcrumb = (pathname) => {
    const breadcrumbItems = [{ path: '/', breadcrumbName: '首页' }];

    if (pathname.startsWith('/conquer-world/task-execution/')) {
      breadcrumbItems.push(
        { path: '/conquer-world', breadcrumbName: '驰骋江山' },
        { path: '/conquer-world/task-management', breadcrumbName: '推广任务管理' },
        { path: pathname, breadcrumbName: '执行任务' }
      );
    } else {
      const pathSnippets = pathname.split('/').filter((i) => i);
      pathSnippets.forEach((_, index) => {
        const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
        breadcrumbItems.push({
          path: url,
          breadcrumbName: routeMap[url] || url,
        });
      });
    }

    return breadcrumbItems;
  };

  return (
    <ProLayout
      title="My Admin"
      menuItemRender={(item, dom) => <Link to={item.path}>{dom}</Link>}
      menuDataRender={() => menuData}
      breadcrumbRender={(routers = []) => getBreadcrumb(location.pathname)}
      itemRender={(route) => <span>{route.breadcrumbName}</span>}
      headerTitleRender={(logo, title) => (
        <Link to="/">
          {logo}
          {title}
        </Link>
      )}
    >
      <PageContainer
        title={getPageTitle(location.pathname)}
      >
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/net-world/hot-posts" element={<HotPosts />} />
          <Route path="/announcement/promotion-items" element={<PromotionItems />} />
          <Route path="/conquer-world/task-management" element={<TaskManagement />} />
          <Route path="/conquer-world/task-execution/:id" element={<TaskExecution />} />
        </Routes>
      </PageContainer>
    </ProLayout>
  );
};

export default BasicLayout;