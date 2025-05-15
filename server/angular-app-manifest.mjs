
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/citizen/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "redirectTo": "/citizen/login",
    "route": "/citizen"
  },
  {
    "renderMode": 2,
    "route": "/citizen/login"
  },
  {
    "renderMode": 2,
    "route": "/citizen/register"
  },
  {
    "renderMode": 2,
    "route": "/citizen/validate-account"
  },
  {
    "renderMode": 2,
    "route": "/citizen/map"
  },
  {
    "renderMode": 2,
    "route": "/citizen/report/new"
  },
  {
    "renderMode": 0,
    "route": "/citizen/report/edit/*"
  },
  {
    "renderMode": 2,
    "route": "/citizen/user/edit"
  },
  {
    "renderMode": 2,
    "route": "/citizen/user/edit/password"
  },
  {
    "renderMode": 2,
    "route": "/citizen/profile"
  },
  {
    "renderMode": 2,
    "route": "/citizen/my-reports"
  },
  {
    "renderMode": 2,
    "route": "/citizen/reset-password"
  },
  {
    "renderMode": 2,
    "route": "/citizen/report-list-admin"
  },
  {
    "renderMode": 2,
    "route": "/citizen/report-histories"
  },
  {
    "renderMode": 2,
    "route": "/citizen/report-summary"
  },
  {
    "renderMode": 2,
    "route": "/citizen/category-list"
  },
  {
    "renderMode": 2,
    "route": "/citizen/categories/create"
  },
  {
    "renderMode": 0,
    "route": "/citizen/categories/edit/*"
  },
  {
    "renderMode": 2,
    "route": "/citizen/**"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 23763, hash: '0db8c0fcb85730f5be092e98801a05040ad584ce5afac8c0a50b0fe197640562', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17303, hash: '3af4ac09169062b7126a7ff0318667d4a66163839bb9ed699ddf6e1f183c55a8', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'login/index.html': {size: 32137, hash: '2d46a0cdcc731c336629fe672818bb76e82b78c5ba4bcd7a96f81002bc59503c', text: () => import('./assets-chunks/login_index_html.mjs').then(m => m.default)},
    'register/index.html': {size: 34228, hash: '02a71f7a1fdea7026952b580fd604cfca26e8c73f98469d9629fd8dc9dcf980e', text: () => import('./assets-chunks/register_index_html.mjs').then(m => m.default)},
    'validate-account/index.html': {size: 32711, hash: '9754db8149364671a23264ee04de1cd4cccc9ac12c3ac758b61e9638070ab4d9', text: () => import('./assets-chunks/validate-account_index_html.mjs').then(m => m.default)},
    'map/index.html': {size: 32137, hash: '2d46a0cdcc731c336629fe672818bb76e82b78c5ba4bcd7a96f81002bc59503c', text: () => import('./assets-chunks/map_index_html.mjs').then(m => m.default)},
    'report/new/index.html': {size: 32137, hash: 'd4940b79b9414919eac4eefa9eec683272bd04216faf93568a5134400d747e3c', text: () => import('./assets-chunks/report_new_index_html.mjs').then(m => m.default)},
    'user/edit/index.html': {size: 32137, hash: '79047517095acbd0652d042d08bc308b8289afebfeafcb07b44be67d0a03792c', text: () => import('./assets-chunks/user_edit_index_html.mjs').then(m => m.default)},
    'user/edit/password/index.html': {size: 32137, hash: '263a9a56cc71e4f31b9143e81946a15e64a465343f284e20614c322359704c53', text: () => import('./assets-chunks/user_edit_password_index_html.mjs').then(m => m.default)},
    'profile/index.html': {size: 32137, hash: 'd4940b79b9414919eac4eefa9eec683272bd04216faf93568a5134400d747e3c', text: () => import('./assets-chunks/profile_index_html.mjs').then(m => m.default)},
    'reset-password/index.html': {size: 33587, hash: '903ed07aa7b3bea627f159e594534a75aed8559d195b9393eb480c0507391c2d', text: () => import('./assets-chunks/reset-password_index_html.mjs').then(m => m.default)},
    'my-reports/index.html': {size: 32137, hash: 'b2d66a6affc6dbcb2d75a28114ee76f2a30be4ed2d630d0b84c9f5063cef140e', text: () => import('./assets-chunks/my-reports_index_html.mjs').then(m => m.default)},
    'report-histories/index.html': {size: 32137, hash: 'b2d66a6affc6dbcb2d75a28114ee76f2a30be4ed2d630d0b84c9f5063cef140e', text: () => import('./assets-chunks/report-histories_index_html.mjs').then(m => m.default)},
    'report-list-admin/index.html': {size: 32137, hash: 'e99dc1826e96e90257befcaad7d6529b1b344997541cfc36e5cb046448c416a8', text: () => import('./assets-chunks/report-list-admin_index_html.mjs').then(m => m.default)},
    'categories/create/index.html': {size: 32137, hash: '9a6e95af841bea83193e6fca7337fe82dd07033147bc0537a051ee8fb24cf14d', text: () => import('./assets-chunks/categories_create_index_html.mjs').then(m => m.default)},
    'category-list/index.html': {size: 32137, hash: '9a6e95af841bea83193e6fca7337fe82dd07033147bc0537a051ee8fb24cf14d', text: () => import('./assets-chunks/category-list_index_html.mjs').then(m => m.default)},
    'report-summary/index.html': {size: 32137, hash: 'fa6b8a6aca7ff5db746c9770df2e57e17073bd060e3b8fd24779f330017d512e', text: () => import('./assets-chunks/report-summary_index_html.mjs').then(m => m.default)},
    'styles-NFR22S6Q.css': {size: 51166, hash: '1b/1GO2Tq6c', text: () => import('./assets-chunks/styles-NFR22S6Q_css.mjs').then(m => m.default)}
  },
};
