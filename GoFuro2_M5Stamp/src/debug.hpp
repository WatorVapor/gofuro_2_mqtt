#pragma once

#if 0
#define DUMP_I(x) { \
  Serial.printf("[dump] %s::%d:%s=<%d>\r\n",__func__,__LINE__,#x,x);\
}
#define DUMP_F(x) { \
  Serial.printf("[dump] %s::%d:%s=<%f>\r\n",__func__,__LINE__,#x,x);\
}
#define DUMP_S(x) { \
  Serial.printf("[dump] %s::%d:%s=<%s>\r\n",__func__,__LINE__,#x,x.c_str());\
}
#else
#define DUMP_I(x) {}
#define DUMP_F(x) {}
#define DUMP_S(x) {}
#endif

#if 1
#define LOG_I(x) { \
  Serial.printf("[log] %s::%d:%s=<%d>\r\n",__func__,__LINE__,#x,x);\
}
#define LOG_F(x) { \
  Serial.printf("[log] %s::%d:%s=<%f>\r\n",__func__,__LINE__,#x,x);\
}
#define LOG_S(x) { \
  Serial.printf("[log] %s::%d:%s=<%s>\r\n",__func__,__LINE__,#x,x.c_str());\
}
#else
#define LOG_I(x) {}
#define LOG_F(x) {}
#define LOG_S(x) {}
#endif
