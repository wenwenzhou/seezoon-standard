import {MessagePlugin} from 'tdesign-vue-next';
import NProgress from 'nprogress'; // progress bar
import 'nprogress/nprogress.css'; // progress bar style
import {getPermissionStore, getSystemStore, getUserStore} from '@/store';
import router from '@/router';
import {getStorageToken} from '@/config/global';

NProgress.configure({showSpinner: false});

router.beforeEach(async (to, from, next) => {
  NProgress.start();

  const userStore = getUserStore();
  const permissionStore = getPermissionStore();
  const systemStore = getSystemStore();
  const {whiteListRouters} = permissionStore;

  //const {token} = userStore;
  const token = getStorageToken();
  if (token) {
    if (to.path === '/login') {
      next();
      return;
    }
    // 加载资源
    if (!systemStore.inited) {
      try {
        await systemStore.getSystemInfo();
      } catch (e) {
        console.error(e)
        NProgress.done();
        return;
      }
    }
    const {roles} = userStore;
    if (roles) {
      next();
    } else {
      try {
        await userStore.getUserInfo();

        const {roles} = userStore;

        await permissionStore.initRoutes(roles);

        if (router.hasRoute(to.name)) {
          next();
        } else {
          next(`/`);
        }
      } catch (error) {
        MessagePlugin.error(error);
        next(`/login?redirect=${to.path}`);
        NProgress.done();
      }
    }
  } else {
    /* white list router */
    if (whiteListRouters.indexOf(to.path) !== -1) {
      next();
    } else {
      next(`/login?redirect=${to.path}`);
    }
    NProgress.done();
  }
});

router.afterEach((to) => {
  if (to.path === '/login') {
    const userStore = getUserStore();
    const permissionStore = getPermissionStore();

    userStore.logout();
    permissionStore.restore();
  }
  NProgress.done();
});