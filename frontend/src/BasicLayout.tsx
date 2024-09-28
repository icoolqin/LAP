import React from 'react';
import ProLayout, { PageContainer, MenuDataItem, ProLayoutProps } from '@ant-design/pro-layout';
import type { ItemType } from 'antd/es/breadcrumb/Breadcrumb';
import { BrowserRouter as Router, Route, Routes, Link, useLocation, useParams } from 'react-router-dom';
import { SmileOutlined } from '@ant-design/icons';
import Dashboard from './pages/Dashboard';
import HotPosts from './pages/HotPosts';
import PromotionItems from './pages/PromotionItems'; 
import TaskManagement from './pages/TaskManagement'; 
import TaskExecution from './pages/TaskExecution'; 
import AccountPoolManagement from './pages/AccountPoolManagement';

interface MenuItem extends Omit<MenuDataItem, 'children'> {
  path: string;
  name: string;
  icon?: React.ReactNode;
  component?: React.ComponentType<any>;
  hideInMenu?: boolean;
  children?: MenuItem[];
}

interface RouteMap {
  [key: string]: string;
}

const BasicLayout: React.FC = () => {
  const location = useLocation();
  const params = useParams();

  const menuData: MenuItem[] = [
    {
      path: '/dashboard',
      name: 'Dashboard',
      icon: <SmileOutlined />,
    },
    {
      path: '/net-world',
      name: '网罗天下',
      icon: <SmileOutlined />,
      children: [
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
      children: [
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
      children: [
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
    {
      path: '/armory',
      name: '兵戈甲库',
      icon: <SmileOutlined />,
      children: [
        {
          path: '/armory/account-pool',
          name: '账号池管理',
          component: AccountPoolManagement,
        },
      ],
    },
  ];  

  const routeMap: RouteMap = {
    '/': '首页',
    '/dashboard': 'Dashboard',
    '/net-world': '网罗天下',
    '/net-world/hot-posts': '热门帖子',
    '/announcement': '昭告全网',
    '/announcement/promotion-items': '自建推广标的',
    '/conquer-world': '驰骋江山',
    '/conquer-world/task-management': '推广任务管理',
    '/conquer-world/task-execution': '执行任务', 
    '/armory': '兵戈甲库',
    '/armory/account-pool': '账号池管理',
  };

  const getPageTitle = (pathname: string): string => {
    if (pathname.startsWith('/conquer-world/task-execution/')) {
      return '执行任务';
    }
    return routeMap[pathname] || pathname;
  };

  const getBreadcrumb = (pathname: string): { path: string; breadcrumbName: string }[] => {
    const breadcrumbItems: { path: string; breadcrumbName: string }[] = [{ path: '/', breadcrumbName: '首页' }];
  
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

  const menuItemRender: ProLayoutProps['menuItemRender'] = (menuItemProps, defaultDom) => (
    <Link to={menuItemProps.path || '/'}>{defaultDom}</Link>
  );

  return (
    <ProLayout
      title="My Admin"
      menuItemRender={(menuItemProps, defaultDom) => (
        <Link to={menuItemProps.path || '/'}>{defaultDom}</Link>
      )}
      menuDataRender={() => menuData}
      breadcrumbRender={(routers = []) => getBreadcrumb(location.pathname)}
      itemRender={(route) => <span>{route.breadcrumbName}</span>}
      headerTitleRender={(logo: React.ReactNode, title: React.ReactNode) => (
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
          <Route path="/armory/account-pool" element={<AccountPoolManagement />} />
        </Routes>
      </PageContainer>
    </ProLayout>
  );
};

export default BasicLayout;