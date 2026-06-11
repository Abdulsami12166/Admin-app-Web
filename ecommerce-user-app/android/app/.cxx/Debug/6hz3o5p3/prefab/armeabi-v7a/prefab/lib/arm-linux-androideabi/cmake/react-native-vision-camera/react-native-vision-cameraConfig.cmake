if(NOT TARGET react-native-vision-camera::VisionCamera)
add_library(react-native-vision-camera::VisionCamera SHARED IMPORTED)
set_target_properties(react-native-vision-camera::VisionCamera PROPERTIES
    IMPORTED_LOCATION "C:/RN/ecommerce-user-app/node_modules/react-native-vision-camera/android/build/intermediates/cxx/Debug/6c1r6y4e/obj/armeabi-v7a/libVisionCamera.so"
    INTERFACE_INCLUDE_DIRECTORIES "C:/RN/ecommerce-user-app/node_modules/react-native-vision-camera/android/build/headers/visioncamera"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

