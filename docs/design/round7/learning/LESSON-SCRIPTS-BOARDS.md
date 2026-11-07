# Board refs used by the pilot lesson scripts (for Studio)

Each distinct { template, params } once, with where it is used (skill/beat).

## fraction-parts@1 (8)

- `{"parts":2,"shade":1,"whole":"roti"}`: c4-s1/e1
- `{"parts":3,"shade":1,"whole":"circle"}`: c4-s1/e3
- `{"parts":4,"shade":1,"whole":"circle"}`: c4-s1/e4
- `{"parts":3,"shade":2,"whole":"roti"}`: c4-s1/we
- `{"parts":3,"shade":1,"whole":"bar"}`: c4-s1/c2, c4-s2/rem1
- `{"parts":4,"shade":1,"whole":"roti"}`: c4-s1/rem2
- `{"parts":2,"shade":1,"whole":"bar"}`: c4-s3/e1
- `{"parts":4,"shade":1,"whole":"bar"}`: c4-s3/e2

## compare@1 (6)

- `{"left":{"title":"Cake A","items":["3 pieces","1 big, 2 small","not thirds"]},"right":{"title":"Cake B","items":["3 pieces","all the same size","each piece = 1/3"]}}`: c4-s1/e2
- `{"left":{"title":"Uneven watermelon cut","items":["1 big slice","2 small slices","not fair → not thirds"]},"right":{"title":"Folded paper strip","items":["3 same-size parts","fair share","each part = 1/3"]}}`: c4-s1/rem1
- `{"left":{"title":"Uneven groups of 16","items":["7, 3, 3, 3","not fair","no quarters"]},"right":{"title":"Equal groups of 16","items":["4, 4, 4, 4","fair share","each group = 1/4"]}}`: c4-s2/rem2
- `{"left":{"title":"Bar cut into 2","items":["2 equal parts","1 part = 1/2","bigger piece"]},"right":{"title":"Same bar cut into 4","items":["4 equal parts","1 part = 1/4","smaller piece"]}}`: c4-s3/e3
- `{"left":{"title":"Bar cut into 3","items":["3 equal parts","1 part = 1/3"]},"right":{"title":"Same bar cut into 4","items":["4 equal parts","1 part = 1/4"]}}`: c4-s3/we
- `{"left":{"title":"Bar in 2 equal parts","items":["1 piece = 1/2","longer piece"]},"right":{"title":"Same bar in 3 equal parts","items":["1 piece = 1/3","shorter piece"]}}`: c4-s3/rem1

## equal-groups@1 (5)

- `{"groups":2,"each":4}`: c4-s2/e1
- `{"groups":3,"each":2}`: c4-s2/e2
- `{"groups":4,"each":3}`: c4-s2/e3
- `{"groups":3,"each":5}`: c4-s2/we
- `{"groups":3,"each":6}`: c4-s2/c1

## fraction-line@1 (23)

- `{"den":2,"from":0,"to":1,"marks":[{"num":1,"label":"1/2"}]}`: c5-s1/e1
- `{"den":4,"from":0,"to":1,"marks":[{"num":1,"label":"1/4"}]}`: c5-s1/e2, c5-s1/rem1
- `{"den":8,"from":0,"to":1,"marks":[{"num":1,"label":"1/8"},{"num":4,"label":"1/2"}]}`: c5-s1/e3
- `{"den":4,"from":0,"to":1,"marks":[{"num":1,"label":"1/4"}],"hop":{"num":1}}`: c5-s1/we
- `{"den":3,"from":0,"to":1}`: c5-s1/c1
- `{"den":10,"from":0,"to":1,"marks":[{"num":2,"label":"1/5"},{"num":5,"label":"1/2"}]}`: c5-s1/rem2
- `{"den":4,"from":0,"to":1,"marks":[{"num":2,"label":"1/2"}],"hop":{"num":2}}`: c5-s1/rem3
- `{"den":3,"from":0,"to":1,"marks":[{"num":2,"label":"2/3"}],"hop":{"num":2}}`: c5-s2/e1
- `{"den":3,"from":0,"to":1,"marks":[{"num":3,"label":"3/3 = 1"}],"hop":{"num":3}}`: c5-s2/e2
- `{"den":6,"from":0,"to":1,"marks":[{"num":2,"label":"2/6"},{"num":3,"label":"3/6 = 1/2"},{"num":5,"label":"5/6"}]}`: c5-s2/e3
- `{"den":5,"from":0,"to":1,"marks":[{"num":2,"label":"2/5"}],"hop":{"num":2}}`: c5-s2/we
- `{"den":6,"from":0,"to":1}`: c5-s2/c1
- `{"den":6,"from":0,"to":1,"hop":{"num":4}}`: c5-s2/rem1
- `{"den":10,"from":0,"to":1,"marks":[{"num":3,"label":"3/10"},{"num":6,"label":"3/5 = 6/10"}]}`: c5-s2/rem2
- `{"den":4,"from":0,"to":1,"marks":[{"num":3,"label":"3/4"}],"hop":{"num":3}}`: c5-s2/rem3
- `{"den":4,"from":0,"to":2,"marks":[{"num":4,"label":"4/4 = 1"}]}`: c5-s3/e1
- `{"den":4,"from":0,"to":2,"marks":[{"num":6,"label":"6/4"}],"hop":{"num":6}}`: c5-s3/e2
- `{"den":3,"from":0,"to":3,"marks":[{"num":3,"label":"3/3 = 1"}]}`: c5-s3/e3
- `{"den":4,"from":0,"to":2,"marks":[{"num":4,"label":"1"},{"num":7,"label":"7/4"}],"hop":{"num":7}}`: c5-s3/we
- `{"den":3,"from":0,"to":2}`: c5-s3/c1
- `{"den":4,"from":0,"to":2,"marks":[{"num":4,"label":"4/4 = 1"}],"hop":{"num":5}}`: c5-s3/rem1
- `{"den":8,"from":0,"to":2,"marks":[{"num":5,"label":"5/8"},{"num":10,"label":"5/4 = 10/8"}]}`: c5-s3/rem2
- `{"den":5,"from":0,"to":2,"marks":[{"num":5,"label":"1 = 5/5"}]}`: c5-s3/rem3

## measured@1 (18)

- `{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}`: c6-s1/e1
- `{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}`: c6-s1/e3
- `{"shape":"rect","unit":"cm","w":10,"h":4}`: c6-s1/c2
- `{"shape":"rect","unit":"cm","w":5,"h":3,"trace":true}`: c6-s1/rem2
- `{"shape":"rect","unit":"m","w":10,"h":6,"trace":true}`: c6-s2/e1, c6-s2/e2, c6-s3/rem2
- `{"shape":"square","unit":"cm","w":6,"h":6,"trace":true}`: c6-s2/e3
- `{"shape":"rect","unit":"cm","w":24,"h":18,"trace":true}`: c6-s2/we
- `{"shape":"rect","unit":"m","w":40,"h":25}`: c6-s2/c1
- `{"shape":"rect","unit":"cm","w":9,"h":5}`: c6-s2/c2
- `{"shape":"square","unit":"cm","w":11,"h":11}`: c6-s2/c3
- `{"shape":"rect","unit":"m","w":14,"h":6,"trace":true}`: c6-s2/rem1
- `{"shape":"rect","unit":"cm","w":7,"h":3,"trace":true}`: c6-s2/rem2
- `{"shape":"square","unit":"m","w":15,"h":15}`: c6-s3/e1
- `{"shape":"rect","unit":"m","w":20,"h":10,"trace":true}`: c6-s3/e2
- `{"shape":"rect","unit":"m","w":12,"h":8,"trace":true}`: c6-s3/e3
- `{"shape":"rect","unit":"m","w":50,"h":30,"trace":true}`: c6-s3/we
- `{"shape":"rect","unit":"m","w":30,"h":20}`: c6-s3/c2
- `{"shape":"rect","unit":"m","w":18,"h":12,"trace":true}`: c6-s3/rem1

## shape@1 (2)

- `{"shape":"hexagon","names":["A","B","C","D","E","F"]}`: c6-s1/e2, c6-s1/rem1
- `{"shape":"pentagon"}`: c6-s1/we
