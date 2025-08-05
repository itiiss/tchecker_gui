# CMake generated Testfile for 
# Source directory: /Users/zhaochen/Downloads/tchecker/test
# Build directory: /Users/zhaochen/Downloads/build/test
# 
# This file includes the relevant testing commands required for 
# testing this directory and lists subdirectories to be tested as well.
add_test(build-tck-reach "/opt/homebrew/bin/cmake" "--build" "/Users/zhaochen/Downloads/build" "--config" "Release" "--target" "tck-reach")
set_tests_properties(build-tck-reach PROPERTIES  FIXTURES_SETUP "BUILD_TCK_REACH" _BACKTRACE_TRIPLES "/Users/zhaochen/Downloads/tchecker/test/CMakeLists.txt;57;add_test;/Users/zhaochen/Downloads/tchecker/test/CMakeLists.txt;0;")
subdirs("testutils")
subdirs("unit-tests")
subdirs("bugfixes")
subdirs("simple-nr")
subdirs("algos")
