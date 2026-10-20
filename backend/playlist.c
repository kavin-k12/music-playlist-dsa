#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#define MAX 512
#define FIELD 512
#define DB "playlist.db"
typedef struct Song { int id; char title[FIELD],artist[FIELD],url[FIELD]; struct Song *prev,*next; } Song;
static Song *head=NULL,*tail=NULL;
static int current=-1, nextid=1;
static void append(int id,const char*t,const char*a,const char*u){Song*s=calloc(1,sizeof(Song));if(!s)exit(1);s->id=id;snprintf(s->title,FIELD,"%s",t);snprintf(s->artist,FIELD,"%s",a);snprintf(s->url,FIELD,"%s",u);s->prev=tail;if(tail)tail->next=s;else head=s;tail=s;}
static Song*find(int id){for(Song*s=head;s;s=s->next)if(s->id==id)return s;return NULL;}
static void load(){FILE*f=fopen(DB,"r");if(!f)return;char line[2048];if(fgets(line,sizeof(line),f))sscanf(line,"%d %d",&current,&nextid);while(fgets(line,sizeof(line),f)){char*id=strtok(line,"\t");char*t=strtok(NULL,"\t");char*a=strtok(NULL,"\t");char*u=strtok(NULL,"\r\n");if(id&&t&&a&&u)append(atoi(id),t,a,u);}fclose(f);}
static void save(){FILE*f=fopen(DB,"w");if(!f){perror("db");exit(1);}fprintf(f,"%d %d\n",current,nextid);for(Song*s=head;s;s=s->next)fprintf(f,"%d\t%s\t%s\t%s\n",s->id,s->title,s->artist,s->url);fclose(f);}
static void esc(const char*s){putchar('"');for(;*s;s++){unsigned char c=*s;if(c=='"'||c=='\\'){putchar('\\');putchar(c);}else if(c=='\n')fputs("\\n",stdout);else if(c=='\r')fputs("\\r",stdout);else if(c<32)putchar(' ');else putchar(c);}putchar('"');}
static void json(){printf("{\"current\":%d,\"songs\":[",current);int first=1;for(Song*s=head;s;s=s->next){if(!first)putchar(',');first=0;printf("{\"id\":%d,\"title\":",s->id);esc(s->title);fputs(",\"artist\":",stdout);esc(s->artist);fputs(",\"url\":",stdout);esc(s->url);putchar('}');}puts("]}");}
static void unlink_song(Song*s){if(s->prev)s->prev->next=s->next;else head=s->next;if(s->next)s->next->prev=s->prev;else tail=s->prev;free(s);}
static void shuffle(){int n=0;for(Song*s=head;s;s=s->next)n++;if(n<2)return;Song**arr=malloc(n*sizeof(Song*));int i=0;for(Song*s=head;s;s=s->next)arr[i++]=s;for(i=n-1;i>0;i--){int j=rand()%(i+1);Song*tmp=arr[i];arr[i]=arr[j];arr[j]=tmp;}head=arr[0];tail=arr[n-1];for(i=0;i<n;i++){arr[i]->prev=i?arr[i-1]:NULL;arr[i]->next=i+1<n?arr[i+1]:NULL;}free(arr);}
int main(int argc,char**argv){load();srand((unsigned)time(NULL));const char*cmd=argc>1?argv[1]:"list";int id=argc>2?atoi(argv[2]):-1;Song*s=NULL;
if(!strcmp(cmd,"add")){if(argc<5)return 2;append(nextid++,argv[2],argv[3],argv[4]);if(current==-1)current=tail->id;}
else if(!strcmp(cmd,"delete")){s=find(id);if(s){if(current==id)current=s->next?s->next->id:(s->prev?s->prev->id:-1);unlink_song(s);}}
else if(!strcmp(cmd,"play")){if(find(id))current=id;}
else if(!strcmp(cmd,"next")){s=find(current);if(s)current=s->next?s->next->id:head->id;else if(head)current=head->id;}
else if(!strcmp(cmd,"previous")){s=find(current);if(s)current=s->prev?s->prev->id:tail->id;else if(tail)current=tail->id;}
else if(!strcmp(cmd,"shuffle"))shuffle();
else if(!strcmp(cmd,"clear")){while(head)unlink_song(head);current=-1;}
else if(strcmp(cmd,"list"))return 2;
if(strcmp(cmd,"list"))save();json();while(head)unlink_song(head);return 0;}
