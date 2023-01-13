const getEnvVariables = () => {
  return {
    proxy_host: process.env.PROXY_HOST || "",
    proxy_user: process.env.PROXY_USER || "",
    proxy_pass: process.env.PROXY_PASS || "",
    email: process.env.EMAIL || "",
    email_pass: process.env.EMAIL_PASS || "",
  };
};

class ResultQueue {
  constructor(tasks, concurrency_count = 1, cb) {
    this.tasks = tasks;
    this.concurrency_count = concurrency_count;
    this.running = [];
    this.cb = cb;
  }

  get runNext() {
    return this.running.length < this.concurrency_count && this.tasks.length;
  }

  resolveTask() {
    while (this.runNext) {
      try {
        const task = this.tasks.shift();
        task()
          .then((res) => {
            this.cb(res);
            this.running.shift();
            this.resolveTask();
          })
          .catch((error) => console.log(error));
        this.running.push(task);
      } catch (error) {
        console.log(error);
      }
    }
  }
}

const removeExtraSpace = (strParam) => {
  const p = strParam;
  return p.replace(/\s/g, "");
};


export {
  getEnvVariables,
  ResultQueue,
  removeExtraSpace,
};
