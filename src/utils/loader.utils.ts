import { Loading } from 'quasar';

export const showLoader = function (message: string) {
  if (message && message != '') {
    Loading.show({
      message: message,
      boxClass: 'bg-grey-2 text-grey-9',
      spinnerColor: 'primary',
    });
  } else {
    Loading.show({
      message: message,
      spinnerColor: 'white',
    });
  }
};
export const hideLoader = function () {
  Loading.hide();
};
