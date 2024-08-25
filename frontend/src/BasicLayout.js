import React from 'react';
import ProLayout, { PageContainer } from '@ant-design/pro-layout';
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from 'react-router-dom';
import { SmileOutlined } from '@ant-design/icons';
import Dashboard from './pages/Dashboard';
import HotPosts from './pages/HotPosts';
import PromotionItems from './pages/PromotionItems'; // 引入新页面组件

const BasicLayout = () => {
  const location = useLocation(); // 获取当前路径
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
  ];

  const routeMap = {
    '/dashboard': 'Dashboard',
    '/net-world/hot-posts': '热门帖子',
    '/announcement/promotion-items': '自建推广标的',
  };

  return (
    <ProLayout
      title="My Admin"
      menuItemRender={(item, dom) => <Link to={item.path}>{dom}</Link>}
      menuDataRender={() => menuData}
      breadcrumbRender={(routes) => {
        return routes.map((route) => ({
          ...route,
          breadcrumbName: routeMap[route.path] || route.path,
        }));
      }}
      pageHeaderRender={(props) => {
        const title = routeMap[location.pathname];
        return { title };
      }}
    >
      <PageContainer title={routeMap[location.pathname]}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/net-world/hot-posts" element={<HotPosts />} />
          <Route path="/announcement/promotion-items" element={<PromotionItems />} />
        </Routes>
      </PageContainer>
    </ProLayout>
  );
};

export default BasicLayout;
