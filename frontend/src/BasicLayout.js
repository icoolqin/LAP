import React from 'react';
import ProLayout, { PageContainer } from '@ant-design/pro-layout';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { SmileOutlined } from '@ant-design/icons';
import Dashboard from './pages/Dashboard';
import HotPosts from './pages/HotPosts';
import PromotionItems from './pages/PromotionItems'; // 引入新页面组件

const BasicLayout = () => {
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
          name: '推广标的管理',
          component: PromotionItems, // 新增菜单项对应的页面组件
        },
      ],
    },
  ];

  return (
    <ProLayout
      title="My Admin"
      menuItemRender={(item, dom) => <Link to={item.path}>{dom}</Link>}
      menuDataRender={() => menuData}
    >
      <PageContainer>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/net-world/hot-posts" element={<HotPosts />} />
          <Route path="/announcement/promotion-items" element={<PromotionItems />} /> 
          {/* 新增的Route */}
        </Routes>
      </PageContainer>
    </ProLayout>
  );
};

export default BasicLayout;
