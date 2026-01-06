#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#pragma warning (disable : 4996)

int main(void) {
	int x = 0;			// 용의자의 수 x 
	int count = 0;			// S가 들어가는 용의자의 수 
	char dap[100] = "";		// S 들어가는 정답 저장할 배열 

	scanf("%d", &x);			//용의자 수 입력받기 

	for (int i = 0; i < x; i++) {		//용의자 수 만큼 반복
		char ary[100] = "";
		scanf("%s", ary);		// 용의자 이름 입력받기 

		int alphabet = strlen(ary);	//용의자 이름 알파벳 수 
		
		for (int i = 0; i < alphabet; i++) {	//용의자 이름 알파벳 수 만큼 반복
			if (ary[i] == 'S') {	//용의자 이름에 S 들어가면 
				strcpy(dap, ary);				//dap 에 내용 저장 
				count++;			//저장할때마다 S가 들어가는 용의자의 수 +1
				break;
			}
		}
	}

	if (count == 1) {				// 용의자 1명이면 ?
		printf("%s", dap);		// 정답 출력 ~~
	}
	return 0;
}