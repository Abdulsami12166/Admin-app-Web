if(NOT TARGET hermes-engine::hermesvm)
add_library(hermes-engine::hermesvm SHARED IMPORTED)
set_target_properties(hermes-engine::hermesvm PROPERTIES
    IMPORTED_LOCATION "C:/Users/HP/.gradle/caches/8.14.3/transforms/9e7dd047edf1c009690769478d591509/transformed/hermes-android-250829098.0.10-debug/prefab/modules/hermesvm/libs/android.armeabi-v7a/libhermesvm.so"
    INTERFACE_INCLUDE_DIRECTORIES "C:/Users/HP/.gradle/caches/8.14.3/transforms/9e7dd047edf1c009690769478d591509/transformed/hermes-android-250829098.0.10-debug/prefab/modules/hermesvm/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

